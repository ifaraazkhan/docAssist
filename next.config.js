/** @type {import('next').NextConfig} */
const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  String(Date.now());

const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => buildId,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
};

module.exports = nextConfig;
