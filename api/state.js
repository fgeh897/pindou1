const { put, head, BlobNotFoundError } = require("@vercel/blob");

const STATE_PATHNAME = "state/pindou-library-state.json";

function applyCors(request, response) {
  const origin = request.headers.origin || "*";
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "86400");
  response.setHeader("Vary", "Origin");
}

function json(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

async function readCloudState() {
  try {
    const blob = await head(STATE_PATHNAME);
    const response = await fetch(blob.downloadUrl || blob.url, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`blob fetch failed (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return null;
    }
    throw error;
  }
}

async function writeCloudState(payload) {
  const body = JSON.stringify(payload);
  return put(STATE_PATHNAME, body, {
    access: "private",
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,
    overwrite: true,
  });
}

module.exports = async (request, response) => {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(response, 503, {
      ok: false,
      error: "BLOB_READ_WRITE_TOKEN is not configured",
    });
  }

  if (request.method === "GET") {
    try {
      const state = await readCloudState();
      return json(response, 200, {
        ok: true,
        state,
      });
    } catch (error) {
      return json(response, 500, {
        ok: false,
        error: error?.message || String(error),
      });
    }
  }

  if (request.method === "PUT") {
    try {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      const payload = JSON.parse(raw || "{}");
      await writeCloudState(payload);
      return json(response, 200, {
        ok: true,
        saved: true,
      });
    } catch (error) {
      return json(response, 500, {
        ok: false,
        error: error?.message || String(error),
      });
    }
  }

  response.setHeader("Allow", "GET, PUT");
  return json(response, 405, {
    ok: false,
    error: "Method Not Allowed",
  });
};
