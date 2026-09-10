import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship a self-contained server bundle so the 2-core box never runs a build
  output: "standalone",
  // playwright-core resolves files at runtime; bundling it breaks the launcher
  serverExternalPackages: ["playwright-core"],
  async redirects() {
    return [
      {
        // Source path
        source: "/",
        // Destination path
        destination: "/home",
        // Permanent redirect (301)
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
