import { NextResponse, type NextRequest } from "next/server";

const REALM = 'Basic realm="Ad Funnel", charset="UTF-8"';

/** Length-independent compare so a wrong password can't be guessed by timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Password-gates the whole site over HTTP Basic auth.
 *
 * With no SITE_PASSWORD set the gate is off, so local dev stays frictionless
 * and a misconfigured deploy fails open rather than locking you out. Set the
 * env var on the host to turn it on.
 */
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const expectedUser = process.env.SITE_USER ?? "redo";
  const header = request.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep !== -1) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (safeEqual(user, expectedUser) && safeEqual(pass, password)) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": REALM },
  });
}

export const config = {
  // Everything except Next's own build output and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
