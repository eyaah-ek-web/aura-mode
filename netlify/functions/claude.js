const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  // 1. Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "No body" })
      };
    }

    const payload = JSON.parse(event.body);
    const type = payload.type || "outfit";

    // 2. analyze_clothing — vision request from dressing.html
    if (type === "analyze_clothing") {
      const { image, mediaType } = payload;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image }
              },
              {
                type: "text",
                text: `Analyse ce vêtement et réponds UNIQUEMENT en JSON: {"name":"...","category":"haut|bas|robe|accessoire|chaussure","color":"...","tags":["...","..."]}`
              }
            ]
          }]
        })
      });

      const data = await response.json();

      if (!data.content || !data.content[0]) {
        return {
          statusCode: 500,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "No content from AI" })
        };
      }

      const text = data.content[0].text.trim();
      const match = text.match(/\{.*\}/s);
      const json = match ? match[0] : text;

      return { statusCode: 200, headers: CORS_HEADERS, body: json };
    }

    // 3. outfit — text request from dashboard.html
    const { temp, description, ville } = payload;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{
          role: "user",
          content: `Météo: ${temp}°C, ${description}, ${ville}. Donne une tenue féminine en JSON UNIQUEMENT: {"haut":"...","bas":"...","acc":"..."}`
        }]
      })
    });

    const data = await response.json();

    if (!data.content || !data.content[0]) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "No content from AI" })
      };
    }

    const text = data.content[0].text.trim();
    const match = text.match(/\{.*\}/s);
    const json = match ? match[0] : text;

    return { statusCode: 200, headers: CORS_HEADERS, body: json };

  } catch (err) {
    console.log("Error:", err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};