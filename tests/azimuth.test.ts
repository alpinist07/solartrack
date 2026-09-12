import { describe, expect, it } from 'vitest';
import { JEJU, azimuth, declination, hourAngle, sunPath, trueSolarTimeMin } from '../lib/solar';

const { lat, lon } = JEJU;
const azAt = (n: number, clockMin: number, atLat = lat) =>
  azimuth(atLat, declination(n), hourAngle(trueSolarTimeMin(clockMin, lon, n)));

describe('azimuth', () => {
  it('남중 때는 정남(180도)을 가리킨다', () => {
    expect(azAt(255, 749)).toBeCloseTo(180, 0);
  });

  it('오전에는 동쪽이라 180도보다 작다', () => {
    const az = azAt(255, 600);
    expect(az).toBeLessThan(180);
    expect(az).toBeGreaterThan(90);
  });

  it('오후에는 서쪽이라 180도보다 크다', () => {
    const az = azAt(255, 900);
    expect(az).toBeGreaterThan(180);
    expect(az).toBeLessThan(270);
  });

  it('춘분 무렵 해는 거의 정동에서 뜬다', () => {
    expect(sunPath(lat, lon, 80, 1)[0].az).toBeCloseTo(90, -1);
  });

  it('하지에는 동지보다 북쪽으로 치우쳐 뜬다', () => {
    const summer = sunPath(lat, lon, 172, 1)[0].az;
    const winter = sunPath(lat, lon, 355, 1)[0].az;
    expect(summer).toBeLessThan(winter);
  });

  it('남반구에서는 해가 북쪽 하늘을 지난다', () => {
    // 시드니 위도에서 남중 때 방위가 북(0도) 쪽이다
    const az = azAt(172, 749, -33.87);
    expect(Math.min(az, 360 - az)).toBeLessThan(30);
  });
});

describe('sunPath', () => {
  it('지평선 위 구간만 돌려준다', () => {
    const path = sunPath(lat, lon, 255, 10);
    expect(path.every((p) => p.alt >= 0)).toBe(true);
    expect(path.length).toBeGreaterThan(50);
  });

  it('하지의 길이 동지의 길보다 길다', () => {
    expect(sunPath(lat, lon, 172, 10).length).toBeGreaterThan(sunPath(lat, lon, 355, 10).length);
  });
});
