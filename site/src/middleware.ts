import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATH_PREFIXES = ["/browse", "/article", "/auth", "/api/auth", "/_next"];
const PUBLIC_FILE_EXTENSIONS = /\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|map|json|css|js|woff2?|ttf|eot)$/i;

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return true;
  }
  if (PUBLIC_FILE_EXTENSIONS.test(pathname)) {
    return true;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/concepts")) {
    const slug = pathname.split("/").filter(Boolean)[1];
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/article/${slug}`;
      return NextResponse.redirect(url);
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/auth/signin";
  url.searchParams.set("callbackUrl", req.nextUrl.href);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
