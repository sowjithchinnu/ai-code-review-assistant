const Groq = require("groq-sdk");

const MODEL = "llama-3.3-70b-versatile";

let groqClient;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

function failure(message) {
  return { success: false, message };
}

function buildPrompt(code, language, analysis) {
  const analysisText = JSON.stringify(analysis ?? [], null, 2);

  return `Review the following ${language} code. Static analysis results are included for context.

Review the code for security vulnerabilities, including SQL Injection, Command Injection, Cross-Site Scripting (XSS), authentication and authorization issues, input validation flaws, secret/API key exposure, unsafe file operations, hardcoded credentials, and OWASP best practices.
Assign severity values for each issue using these impact levels: Critical for hardcoded secrets or API keys, SQL Injection, or authentication bypass; High for eval(), new Function, command execution, or XSS; Medium for missing input validation or authorization checks; Low for style issues such as console.log or unused variables.

Static analysis results:
${analysisText}

Code:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON only using this exact shape:
{
  "summary": "brief overall review",
  "issues": [
    {
      "severity": "Low | Medium | High | Critical",
      "line": 1,
      "message": "description of the issue",
      "rule": "optional rule or category"
    }
  ],
  "suggestions": ["actionable improvement suggestion"],
  "improvedCode": "full improved version of the code"
}`;
}

function parseReviewResponse(content) {
  const parsed = JSON.parse(content);

  return {
    success: true,
    summary: parsed.summary ?? "",
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    improvedCode: parsed.improvedCode ?? "",
  };
}

async function generateAIReview(code, language, analysis) {
  if (!code || !language) {
    return failure("Code and language are required for AI review");
  }

  const client = getClient();

  if (!client) {
    return failure("GROQ_API_KEY is not configured");
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer performing code reviews. Return valid JSON only. Be specific, practical, and preserve the original language.",
        },
        {
          role: "user",
          content: buildPrompt(code, language, analysis),
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return failure("Groq returned an empty response");
    }

    try {
      return parseReviewResponse(content);
    } catch (parseError) {
      return failure(
        parseError instanceof Error
          ? `Failed to parse AI review response: ${parseError.message}`
          : "Failed to parse AI review response"
      );
    }
  } catch (error) {
    const message =
      error?.error?.message ||
      error?.message ||
      "Failed to generate AI review";

    return failure(message);
  }
}

module.exports = {
  generateAIReview,
};
