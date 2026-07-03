import { NextRequest, NextResponse } from "next/server";

const STAFF_ROLE = "staff";

export function middleware(request: NextRequest) {
  const role = request.cookies.get("oau_user_role")?.value;
  const accessToken = request.cookies.get("oau_access_token")?.value;

  if (request.nextUrl.pathname.startsWith("/upload") || request.nextUrl.pathname.startsWith("/dashboard/staff")) {
    if (!accessToken || role !== STAFF_ROLE) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "staff-only");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/dashboard/staff/:path*"],
};
