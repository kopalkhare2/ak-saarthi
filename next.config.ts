import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    // seed.db is copied to /tmp at cold-start by lib/prisma.ts.
    // It is not statically imported, so we must tell the file tracer to
    // bundle it explicitly into every serverless function.
    "/api/**": ["./prisma/seed.db"],
  },
};

export default nextConfig;
