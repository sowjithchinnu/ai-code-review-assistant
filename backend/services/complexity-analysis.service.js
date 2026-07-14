const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const escomplex = require("escomplex");

const execAsync = promisify(exec);

async function analyzeDuplication(filePath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jscpd-"));
  const reportPath = path.join(tempDir, "jscpd-report.json");
  const command = `npx jscpd --reporters json --min-lines 2 --min-tokens 1 --silent --no-tips --exit-code 0 --output ${JSON.stringify(tempDir)} ${JSON.stringify(filePath)}`;

  try {
    await execAsync(command, { cwd: path.join(__dirname, ".."), maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    if (!fs.existsSync(reportPath)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return {
        duplicatePercentage: 0,
        duplicatedBlocks: 0,
        duplicatedLines: 0,
      };
    }
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const stats = report.statistics?.total || report.statistics || {};

    return {
      duplicatePercentage: stats.percentage || 0,
      duplicatedBlocks: stats.clones || 0,
      duplicatedLines: stats.duplicatedLines || 0,
    };
  } catch (parseError) {
    return {
      duplicatePercentage: 0,
      duplicatedBlocks: 0,
      duplicatedLines: 0,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function analyzeComplexity(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf8");

    const report = escomplex.analyse(code);
    const complexity = report.aggregate.cyclomatic;

    const functions = report.functions || [];
    const classes = report.classes || [];

    const codeSmells = [];

    if (complexity > 10) {
      codeSmells.push("High cyclomatic complexity");
    }

    if (functions.length > 10) {
      codeSmells.push("Too many functions");
    }

    if (classes.length > 5) {
      codeSmells.push("Too many classes");
    }

    if (code.split("\n").length > 300) {
      codeSmells.push("Large source file");
    }

    const duplication = await analyzeDuplication(filePath);

    if (duplication.duplicatePercentage > 0) {
      codeSmells.push("Duplicate code detected");
    }

    return {
      success: true,
      complexity:
        complexity <= 5
          ? "Low"
          : complexity <= 10
          ? "Medium"
          : "High",

      cyclomaticComplexity: complexity,

      functionComplexity: functions.map((fn) => ({
        name: fn.name || "anonymous",
        complexity: fn.cyclomatic,
      })),

      fileComplexity: complexity,

      numberOfFunctions: functions.length,

      numberOfClasses: classes.length,

      linesOfCode: code
        .split("\n")
        .filter((line) => line.trim() !== "").length,

      duplicatePercentage: duplication.duplicatePercentage,
      duplicatedBlocks: duplication.duplicatedBlocks,
      duplicatedLines: duplication.duplicatedLines,
      codeSmells,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

module.exports = { analyzeComplexity };