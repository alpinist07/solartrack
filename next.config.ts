import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 서버 없이 out/ 폴더만으로 배포한다
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
