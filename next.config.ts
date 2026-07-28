import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bỏ qua lỗi TS khi build để deploy Vercel mượt hơn (như bạn đã cấu hình)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // eslint: { ignoreDuringBuilds: true }, // Bạn có thể thêm dòng này nếu bị lỗi ESLint chặn deploy
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: 'https',
        hostname: '**', // Cho phép tất cả các domain HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // Cho phép tất cả các domain HTTP (nếu cần)
      },
    ],
  },
  
  webpack(config) {
    // 1. Tìm rule mặc định của Next.js đang xử lý file SVG
    // Dùng optional chaining (?.) để tránh lỗi nếu rule không phải RegExp
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg")
    );

    if (fileLoaderRule) {
      config.module.rules.push(
        // Rule 1: Nếu import file có đuôi ?url (VD: import icon from './icon.svg?url')
        // -> Dùng loader mặc định của Next.js để lấy đường dẫn string
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/, // Chỉ áp dụng cho *.svg?url
        },

        // Rule 2: Các trường hợp còn lại (import icon from './icon.svg')
        // -> Dùng @svgr/webpack để biến thành React Component
        {
          test: /\.svg$/i,
          issuer: fileLoaderRule.issuer,
          // [SỬA LỖI QUAN TRỌNG]: Thêm `|| []` để tránh lỗi nếu resourceQuery không tồn tại
          resourceQuery: { 
            not: [...(fileLoaderRule.resourceQuery?.not || []), /url/] 
          },
          use: ["@svgr/webpack"],
        }
      );

      // 3. Loại bỏ SVG khỏi rule mặc định ban đầu để tránh xử lý trùng lặp
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;