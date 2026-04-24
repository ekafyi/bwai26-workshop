import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
	reactCompiler: true,

	// Don't bundle these
	serverExternalPackages: ["@google/adk", "@mikro-orm/sqlite", "better-sqlite3"],
};

export default nextConfig;
