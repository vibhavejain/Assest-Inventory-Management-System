export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // API routes
    if (url.pathname.startsWith("/api")) {
      return handleApiRoutes(request, url);
    }

    // Default response
    return new Response(
      JSON.stringify({
        message: "Asset Inventory Management System API",
        version: "1.0.0",
        endpoints: ["/health", "/api/assets"],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};

async function handleApiRoutes(request: Request, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = request.method;

  // Assets endpoint
  if (pathname === "/api/assets") {
    if (method === "GET") {
      // TODO: Fetch assets from database
      return new Response(JSON.stringify({ assets: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      // TODO: Create new asset
      const body = await request.json();
      return new Response(JSON.stringify({ message: "Asset created", data: body }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 404 for unknown API routes
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

interface Env {
  // Add your bindings here (KV, D1, etc.)
}
