/** @type {import('next').NextConfig} */
const prefix = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // 只给静态资源加前缀；页面路由仍是 / 和 /chat
  assetPrefix: prefix || undefined,
  images: { unoptimized: true },
  // 小提示，方便你在日志里确认变量值
  webpack: (config) => {
    console.log('[next.config] assetPrefix =', prefix);
    return config;
  },
};

export default nextConfig;
