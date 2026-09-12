import { describe, expect, it } from 'vitest';

/**
 * SkyScene의 태양 배치 계산.
 * 컴포넌트와 같은 값을 쓰며, 어떤 고도에서도 해가 viewBox 안에 있어야 한다.
 */
const W = 720;
const GROUND = 340;
const PLATE_X = 240;
const MARGIN_X = 44;
const MARGIN_TOP = 36;
const SUN_DIST = 260;

const rad = (deg: number) => (deg * Math.PI) / 180;

function sunPos(altDeg: number) {
  const c = Math.cos(rad(altDeg));
  const s = Math.sin(rad(altDeg));
  const maxByX = c > 0.001 ? (PLATE_X - MARGIN_X) / c : Infinity;
  const maxByY = s > 0.001 ? (GROUND - MARGIN_TOP) / s : Infinity;
  const r = Math.min(SUN_DIST, maxByX, maxByY);
  return { x: PLATE_X - r * c, y: GROUND - r * s };
}

describe('태양 배치', () => {
  it('5도부터 89도까지 모두 화면 안에 들어온다', () => {
    for (let alt = 5; alt <= 89; alt++) {
      const { x, y } = sunPos(alt);
      expect(x, `고도 ${alt}도의 x`).toBeGreaterThanOrEqual(MARGIN_X - 0.01);
      expect(x, `고도 ${alt}도의 x`).toBeLessThanOrEqual(PLATE_X);
      expect(y, `고도 ${alt}도의 y`).toBeGreaterThanOrEqual(MARGIN_TOP - 0.01);
      expect(y, `고도 ${alt}도의 y`).toBeLessThanOrEqual(GROUND);
    }
  });

  it('고쳐지기 전 방식은 낮은 고도에서 화면 밖으로 나갔다', () => {
    // 옛 값: PLATE_X 150, 거리 고정 250
    const oldX = 150 - 250 * Math.cos(rad(30));
    expect(oldX).toBeLessThan(0);
  });

  it('해가 높을수록 위로, 낮을수록 왼쪽으로 간다', () => {
    expect(sunPos(70).y).toBeLessThan(sunPos(30).y);
    expect(sunPos(70).x).toBeGreaterThan(sunPos(30).x);
  });

  it('센서 15cm 자리도 화면 안에 들어온다', () => {
    expect(PLATE_X + 15 * 24).toBeLessThan(W);
  });
});
