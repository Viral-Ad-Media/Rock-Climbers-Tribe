import { auth } from "@/lib/auth";

/**
 * The site uses trailing slashes (to match the old WordPress URLs), but Better Auth's
 * router expects paths without one, so strip it before handing the request over.
 */
function handler(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    request = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      // Required by Node when streaming a request body
      duplex: "half",
    } as RequestInit);
  }
  return auth.handler(request);
}

export { handler as GET, handler as POST };
