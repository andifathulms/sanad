/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // DRF requires trailing slashes; don't let Next strip them before proxying /api/*.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Proxy /api/* to the Django backend during development.
    const backend = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

module.exports = nextConfig;
