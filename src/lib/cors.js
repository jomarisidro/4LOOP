import { NextResponse } from "next/server";

export function withCors(handler) {
  return async (request, ...args) => {
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      setCorsHeaders(response);
      return response;
    }

    const response = await handler(request, ...args);
    setCorsHeaders(response);
    return response;
  };
}

function setCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "https://fourloop-zpio.onrender.com");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
}
