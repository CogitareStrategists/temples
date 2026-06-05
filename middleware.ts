export { default } from "next-auth/middleware";

// Protect everything under /dashboard. Unauthenticated users are sent to /login.
export const config = { matcher: ["/dashboard/:path*"] };
