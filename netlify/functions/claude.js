const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  // باش تخدم الـ CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const payload = JSON.parse(event.body);
    const type = payload.type || "outfit";

    // ===== حالة تحليل الصورة (من dressing.html) =====
    if (type === "analyze_clothing") {
      const { image, mediaType } = payload;

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
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
                  text: `Analyse ce vêtement et réponds UNIQUEMENT en JSON: {"name":"...","category":"haut|bas|robe|accessoire|chaussure","color":"...","tags":["tag1","tag2"]}`
                }
              ]
            }]
          })
        });

        const data = await response.json();
        
        // إذا ما خدمتش الـ API، نرجع معطيات وهمية (fallback)
        if (!data.content || !data.content[0]) {
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
              name: "Vêtement", 
              category: "haut", 
              color: "", 
              tags: ["Vêtement"] 
            })
          };
        }

        const text = data.content[0].text.trim();
        const match = text.match(/\{.*\}/s);
        const jsonStr = match ? match[0] : text;
        
        let result;
        try {
          result = JSON.parse(jsonStr);
        } catch(e) {
          result = { name: "Vêtement", category: "haut", color: "", tags: ["Vêtement"] };
        }
        
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };
        
      } catch(error) {
        // فاش كاين خطأ فـ الـ API، نرجع معطيات وهمية
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ name: "Vêtement", category: "haut", color: "", tags: ["Vêtement"] })
        };
      }
    }

    // ===== حالة اقتراح الملابس (من dashboard.html) =====
    const { temp, description, ville } = payload;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
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
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ haut: "Pull Beige", bas: "Jean Mom", acc: "Sac Cuir" })
        };
      }

      const text = data.content[0].text.trim();
      const match = text.match(/\{.*\}/s);
      const jsonStr = match ? match[0] : text;
      
      let result;
      try {
        result = JSON.parse(jsonStr);
      } catch(e) {
        result = { haut: "Pull Beige", bas: "Jean Mom", acc: "Sac Cuir" };
      }
      
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };

    } catch(error) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ haut: "Pull Beige", bas: "Jean Mom", acc: "Sac Cuir" })
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};