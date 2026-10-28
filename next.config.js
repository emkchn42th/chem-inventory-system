/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Vercel 배포용: data 폴더(reagents.json, inventory.csv)를 서버 묶음에 함께 넣는다.
  // 이 설정이 없으면 배포된 서버가 데이터 파일을 찾지 못할 수 있다.
  // (6차시에 DB로 옮기면 필요 없어진다)
  experimental: {
    // 한 번 열어 본 화면은 30초 동안 브라우저가 기억해서, 다시 갈 때 바로 보여 준다.
    // (대여·반납·수정을 하면 router.refresh() 로 바로 새로 읽으므로 내 변경은 즉시 반영됨)
    staleTimes: {
      dynamic: 30,
    },

    outputFileTracingIncludes: {
      "/**": ["./data/**/*"],
    },
  },
};

module.exports = nextConfig;
