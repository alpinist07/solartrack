import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 계산 코어는 브라우저 API에 의존하지 않으므로 node 환경으로 충분하다
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
