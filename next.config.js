/** @type {import('next').NextConfig} */
const nextConfig = {
  // 프로덕션 빌드(Cloudflare Pages)에서만 static export
  // 로컬 dev에서는 API route 사용 가능
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
