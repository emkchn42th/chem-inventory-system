/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Vercel 배포용: data 폴더(reagents.json, inventory.csv)를 서버 묶음에 함께 넣는다.
  // 이 설정이 없으면 배포된 서버가 데이터 파일을 찾지 못할 수 있다.
  // (6차시에 DB로 옮기면 필요 없어진다)
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./data/**/*"],
    },
  },
};

module.exports = nextConfig;
