const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");

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
  console.log("Running ESLint:", filePath);
  const command = `npx eslint --no-ignore ${JSON.stringify(filePath)} -f json`;

  const { stdout, stderr } = await runCommand(command);

  const results = parseJsonOutput(stdout);
  return parseEslintIssues(results);
}

async function analyzePython(filePath) {
  console.log("Running Pylint:", filePath);

  const command = `pylint ${JSON.stringify(filePath)} --output-format=json`;

  try {
    const { stdout } = await runCommand(command);
    const results = parseJsonOutput(stdout);
    return parsePylintIssues(results);
  } catch (error) {
    return failure(error.message);
  }
}

module.exports = {
  analyzeJavaScript,
  analyzePython,
};
