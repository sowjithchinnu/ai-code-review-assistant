const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const { builtinModules } = require("module");
const esprima = require("esprima");
const prettier = require("prettier");

const execAsync = promisify(exec);

const EXEC_OPTIONS = {
  maxBuffer: 10 * 1024 * 1024,
  cwd: path.join(__dirname, ".."),
};

function failure(message) {
  return { success: false, message };
}

function parseJsonOutput(output) {
  const trimmed = output.trim();

  if (!trimmed) {
    return [];
  }

  return JSON.parse(trimmed);
}

function parseEslintIssues(results) {
  if (!Array.isArray(results)) {
    throw new Error("Unexpected ESLint output format");
  }

  const issues = [];

  for (const file of results) {
    for (const message of file.messages || []) {
      issues.push({
        line: message.line,
        column: message.column,
        endLine: message.endLine,
        endColumn: message.endColumn,
        message: message.message,
        severity: message.severity === 2 ? "error" : "warning",
        rule: message.ruleId,
      });
    }
  }

  return issues;
}

function parsePylintIssues(results) {
  if (!Array.isArray(results)) {
    throw new Error("Unexpected Pylint output format");
  }

  return results.map((item) => ({
    line: item.line,
    column: item.column,
    message: item.message,
    severity: item.type,
    rule: item.symbol,
    module: item.module,
  }));
}

function isBuiltinModule(source) {
  const normalized = source.startsWith("node:") ? source.slice(5) : source;
  return builtinModules.includes(normalized);
}

function resolveImport(source, filePath) {
  if (!source || isBuiltinModule(source)) {
    return true;
  }

  try {
    require.resolve(source, { paths: [path.dirname(filePath)] });
    return true;
  } catch (error) {
    return false;
  }
}

function buildImportIssue(source, loc) {
  return {
    line: loc.line,
    column: loc.column + 1,
    endLine: loc.line,
    endColumn: loc.column + 1,
    message: `Unable to resolve import '${source}'`,
    severity: "error",
    rule: "import/no-unresolved",
  };
}

function buildSecurityIssue(message, loc, severity, rule) {
  return {
    line: loc.line,
    column: loc.column + 1,
    endLine: loc.line,
    endColumn: loc.column + 1,
    message,
    severity,
    rule,
  };
}

function walkAst(node, callback, parent = null) {
  if (!node || typeof node !== "object") {
    return;
  }

  callback(node, parent);

  for (const key of Object.keys(node)) {
    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach((value) => walkAst(value, callback, node));
    } else if (child && typeof child === "object" && child.type) {
      walkAst(child, callback, node);
    }
  }
}

function detectMissingImports(filePath, code) {
  const issues = [];
  let ast;

  try {
    ast = esprima.parseModule(code, { loc: true, tolerant: true });
  } catch (error) {
    try {
      ast = esprima.parseScript(code, { loc: true, tolerant: true });
    } catch (parseError) {
      return issues;
    }
  }

  walkAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      const source = node.source && node.source.value;
      if (typeof source === "string" && !resolveImport(source, filePath)) {
        issues.push(buildImportIssue(source, node.loc.start));
      }
    }

    if (
      node.type === "CallExpression" &&
      node.callee &&
      node.callee.type === "Identifier" &&
      node.callee.name === "require" &&
      Array.isArray(node.arguments) &&
      node.arguments.length === 1 &&
      node.arguments[0].type === "Literal" &&
      typeof node.arguments[0].value === "string"
    ) {
      const source = node.arguments[0].value;
      if (!resolveImport(source, filePath)) {
        issues.push(buildImportIssue(source, node.loc.start));
      }
    }
  });

  return issues;
}

function detectSecurityIssues(code) {
  const issues = [];
  let ast;

  try {
    ast = esprima.parseModule(code, { loc: true, tolerant: true });
  } catch (error) {
    try {
      ast = esprima.parseScript(code, { loc: true, tolerant: true });
    } catch (parseError) {
      return issues;
    }
  }

  const childProcessAliases = new Set();

  walkAst(ast, (node) => {
    if (!node || !node.type) {
      return;
    }

    if (node.type === "ImportDeclaration" && node.source && node.source.value === "child_process") {
      if (node.specifiers) {
        node.specifiers.forEach((specifier) => {
          if (specifier.local && specifier.local.name) {
            childProcessAliases.add(specifier.local.name);
          }
        });
      }
    }

    if (node.type === "VariableDeclarator" && node.init && node.init.type === "CallExpression") {
      const callee = node.init.callee;
      if (callee && callee.type === "Identifier" && callee.name === "require" && node.init.arguments?.[0]?.value === "child_process") {
        if (node.id && node.id.type === "Identifier") {
          childProcessAliases.add(node.id.name);
        }

        if (node.id && node.id.type === "ObjectPattern") {
          node.id.properties.forEach((property) => {
            if (property.type === "Property" && property.key && property.key.name) {
              childProcessAliases.add(property.key.name);
            }
          });
        }
      }
    }

    if (node.type === "CallExpression") {
      const callee = node.callee;
      const isEval = callee && callee.type === "Identifier" && callee.name === "eval";
      const isNewFunction = node.type === "NewExpression" && callee && callee.type === "Identifier" && callee.name === "Function";
      const isExec = callee && ((callee.type === "MemberExpression" && callee.object && ((callee.object.type === "Identifier" && callee.object.name === "child_process") || (callee.object.type === "CallExpression")) && callee.property && callee.property.name === "exec") || (callee.type === "Identifier" && childProcessAliases.has(callee.name) && callee.name === "exec"));
      const isExecSync = callee && ((callee.type === "MemberExpression" && callee.object && ((callee.object.type === "Identifier" && callee.object.name === "child_process") || (callee.object.type === "CallExpression")) && callee.property && callee.property.name === "execSync") || (callee.type === "Identifier" && childProcessAliases.has(callee.name) && callee.name === "execSync"));

      if (isEval) {
        issues.push(buildSecurityIssue("Avoid eval() because it can execute arbitrary code.", node.loc.start, "error", "security"));
      }

      if (isNewFunction) {
        issues.push(buildSecurityIssue("Avoid new Function(...) because it can execute arbitrary code.", node.loc.start, "error", "security"));
      }

      if (isExec || isExecSync) {
        issues.push(buildSecurityIssue("Avoid executing shell commands with child_process methods.", node.loc.start, "error", "security"));
      }

      const firstArg = node.arguments && node.arguments[0];
      if (
        callee &&
        callee.type === "MemberExpression" &&
        callee.object &&
        callee.object.type === "Identifier" &&
        callee.object.name === "fs" &&
        callee.property &&
        callee.property.name && /writeFileSync|appendFileSync|unlinkSync|readFileSync|createWriteStream|createReadStream/.test(callee.property.name) &&
        firstArg &&
        firstArg.type === "Identifier" &&
        /(^user|^file|^path|^req|^input|^data|user|path|file)/i.test(firstArg.name)
      ) {
        issues.push(buildSecurityIssue("File operations should validate user-controlled paths before writing.", node.loc.start, "warning", "security"));
      }
    }

    if (node.type === "VariableDeclarator" && node.id && node.id.type === "Identifier") {
      const varName = node.id.name || "";
      const isSecretName = /(?:api[_-]?key|token|secret|password|passwd|pwd)/i.test(varName);
      if (isSecretName && node.init && node.init.type === "Literal" && typeof node.init.value === "string") {
        issues.push(buildSecurityIssue("Hardcoded secret or credential detected.", node.loc.start, "error", "security"));
      }
    }

    if (node.type === "Literal" && typeof node.value === "string") {
      const value = node.value;
      const isHardcodedSecret = /(?:api[_-]?key|token|secret)/i.test(value);
      const isHardcodedPassword = /(?:password|passwd|pwd)/i.test(value);
      if (isHardcodedSecret) {
        issues.push(buildSecurityIssue("Hardcoded secret or API key detected.", node.loc.start, "error", "security"));
      }
      if (isHardcodedPassword) {
        issues.push(buildSecurityIssue("Hardcoded password detected.", node.loc.start, "error", "security"));
      }
    }
  }, ast);

  return issues;
}

function buildFormattingIssue() {
  return {
    line: 1,
    column: 1,
    endLine: 1,
    endColumn: 1,
    message: "Code is not formatted according to Prettier.",
    severity: "warning",
    rule: "prettier/prettier",
  };
}

async function detectFormattingIssues(filePath, code) {
  try {
    const fileInfo = await prettier.getFileInfo(filePath, {
      ignorePath: path.join(__dirname, "..", ".prettierignore"),
      withNodeModules: false,
    });

    if (fileInfo.ignored || !fileInfo.inferredParser) {
      return [];
    }

    const config = await prettier.resolveConfig(filePath);
    const formatted = await prettier.check(code, {
      filepath: filePath,
      parser: fileInfo.inferredParser,
      ...config,
    });

    if (formatted) {
      return [];
    }

    return [buildFormattingIssue()];
  } catch (error) {
    return [];
  }
}

async function runCommand(command) {
  try {
    return await execAsync(command, EXEC_OPTIONS);
  } catch (error) {
    if (error.stdout) {
      return { stdout: error.stdout, stderr: error.stderr || "" };
    }

    throw error;
  }
}

async function analyzeJavaScript(filePath) {
  const resolvedPath = path.resolve(filePath);
  const command = `npx eslint --no-ignore ${JSON.stringify(resolvedPath)} -f json`;

  try {
    const { stdout } = await runCommand(command);
    const results = parseJsonOutput(stdout);
    const eslintIssues = parseEslintIssues(results);

    let code = "";
    try {
      code = fs.readFileSync(filePath, "utf8");
    } catch (readError) {
      // Skip import analysis if the file cannot be read.
    }

    const importIssues = detectMissingImports(filePath, code);
    const securityIssues = detectSecurityIssues(code);
    const formattingIssues = await detectFormattingIssues(filePath, code);

    return {
      issues: [...eslintIssues, ...importIssues, ...securityIssues],
      formattingIssues,
    };
  } catch (error) {
    return {
      issues: [],
      formattingIssues: [],
    };
  }
}

async function analyzePython(filePath) {

  const command = `pylint ${JSON.stringify(filePath)} --output-format=json`;

  try {
    const { stdout } = await runCommand(command);
    const results = parseJsonOutput(stdout);
    return {
      issues: parsePylintIssues(results),
      formattingIssues: [],
    };
  } catch (error) {
    return {
      issues: [],
      formattingIssues: [],
    };
  }
}

module.exports = {
  analyzeJavaScript,
  analyzePython,
};
