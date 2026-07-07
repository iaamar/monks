/**
 * Cloudflare Worker AI Proxy for Google Apps Script
 *
 * Endpoints:
 * POST /generate-image
 * POST /refine-prompt
 */

export default {
  async fetch(request, env) {
    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);

    try {
      const body = await request.json();

      switch (url.pathname) {
        case "/generate-image": {
          const {
            prompt,
            negative_prompt,
            width = 512,
            height = 512,
          } = body;

          if (!prompt) {
            return json(
              { error: "Prompt is required" },
              400
            );
          }

          const inputs = {
            prompt,
            negative_prompt:
              negative_prompt ||
              "blurry, low quality, distorted",
            width,
            height,
          };

          // Same pattern as Cloudflare sample
          const response = await env.AI.run(
            "@cf/stabilityai/stable-diffusion-xl-base-1.0",
            inputs
          );

          const imageBuffer = await response.arrayBuffer();

          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(imageBuffer))
          );

          return json({
            image_b64: base64,
          });
        }

        case "/refine-prompt": {
          const {
            messages,
            max_tokens = 512,
          } = body;

          if (!Array.isArray(messages)) {
            return json(
              { error: "Messages array is required" },
              400
            );
          }

          const inputs = {
            messages,
            max_tokens,
          };

          // Same pattern as Cloudflare sample
          const response = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct",
            inputs
          );

          return json(response);
        }

        default:
          return new Response("Not Found", {
            status: 404,
            headers: corsHeaders(),
          });
      }
    } catch (err) {
      return json(
        {
          error: err.message,
        },
        500
      );
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}