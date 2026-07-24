import type { NextConfig } from "next";

// Static export so the app can be hosted on GitHub Pages (fully client-side,
// no server features used). NEXT_PUBLIC_BASE_PATH is set by the deploy
// workflow to "/Well-beings" for project-page hosting; empty locally.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
};

export default nextConfig;
