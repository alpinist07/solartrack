/**
 * 발표와 수업에서 쓰는 예시 데이터.
 * 자동으로 넣지 않는다. 기록 탭의 [예시 데이터 불러오기]를 눌러야 들어간다.
 */

import { EZMAKER_4CH, shadowLength } from '@/lib/shadow';
import { JEJU, altitude, declination, hourAngle, trueSolarTimeMin } from '@/lib/solar';
import type { Snapshot } from '@/store/useStore';

/** 9월 12일 제주에서 한 시간 간격으로 잰 것처럼 만든 스냅샷 */
export function seedSnapshots(dayOfYear = 255): Snapshot[] {
  const decl = declination(dayOfYear);
  const base = new Date();
  base.setSeconds(0, 0);

  return [540, 600, 660, 720, 780, 840].map((clockMin) => {
    const alt = altitude(JEJU.lat, decl, hourAngle(trueSolarTimeMin(clockMin, JEJU.lon, dayOfYear)));
    const t = new Date(base);
    t.setHours(Math.floor(clockMin / 60), clockMin % 60);
    return {
      t: t.getTime(),
      alt,
      shadow: shadowLength(EZMAKER_4CH.plateHeightCm, alt),
      note: '예시',
    };
  });
}
