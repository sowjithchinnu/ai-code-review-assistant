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

function buildPrompt(code, language) {
  return `Generate concise technical documentation for the following ${language} code.

Focus on the main purpose of the code, the public functions and classes, and any HTTP API endpoints that are defined or implied.

Code:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON only using this exact shape:
{
  "summary": "brief overview of the code",
  "functions": [
    {
      "name": "function name",
      "description": "what the function does",
      "parameters": ["parameter name"],
      "returns": "return value description"
    }
  ],
  "classes": [
    {
      "name": "class name",
      "description": "what the class represents",
      "methods": ["method name or short description"]
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET",
      "path": "/api/example",
      "description": "what the endpoint does"
    }
  ]
}`;
}

function parseDocumentationResponse(content) {
  const parsed = JSON.parse(content);

  return {
    success: true,
    summary: parsed.summary ?? "",
    functions: Array.isArray(parsed.functions) ? parsed.functions : [],
    classes: Array.isArray(parsed.classes) ? parsed.classes : [],
    apiEndpoints: Array.isArray(parsed.apiEndpoints) ? parsed.apiEndpoints : [],
  };
}

async function generateDocumentation(code, language) {
  if (!code || !language) {
    return failure("Code and language are required for documentation generation");
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
            "You are a senior software engineer generating technical documentation. Return valid JSON only. Be concise and practical.",
        },
        {
          role: "user",
          content: buildPrompt(code, language),
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return failure("Groq returned an empty response");
    }

    try {
      return parseDocumentationResponse(content);
    } catch (parseError) {
      return failure(
        parseError instanceof Error
          ? `Failed to parse documentation response: ${parseError.message}`
          : "Failed to parse documentation response"
      );
    }
  } catch (error) {
    const message =
      error?.error?.message ||
      error?.message ||
      "Failed to generate documentation";

    return failure(message);
  }
}

module.exports = {
  generateDocumentation,
};
