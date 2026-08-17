const KV_KEY = "bookmarks";

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname !== "/api/bookmarks") {
    return json({ ok: false, error: "not found" }, 404);
  }

  if (!env.BOOKMARKS) {
    return json({ ok: false, error: "kv not bound" }, 503);
  }

  if (request.method === "GET") {
    const raw = await env.BOOKMARKS.get(KV_KEY);
    return json(raw ? JSON.parse(raw) : []);
  }

  if (request.method === "PUT" || request.method === "POST") {
    try {
      const body = await request.json();
      if (!Array.isArray(body)) {
        return json({ ok: false, error: "expected an array of bookmarks" }, 400);
      }
      await env.BOOKMARKS.put(KV_KEY, JSON.stringify(body));
      return json({ ok: true });
    } catch (err) {
      return json({ ok: false, error: "invalid body" }, 400);
    }
  }

  return json({ ok: false, error: "method not allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
