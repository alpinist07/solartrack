/**
 * 태양의 위치와 계절 계산.
 * 브라우저 API와 React에 의존하지 않는 순수 함수만 둔다.
 * 각도 인자와 반환값은 모두 도(°). 날짜는 1월 1일 = 1인 연중 일수 n.
 */

const DEG = Math.PI / 180;

const toRad = (deg: number): number => deg * DEG;
const toDeg = (rad: number): number => rad / DEG;
const sinD = (deg: number): number => Math.sin(toRad(deg));
const cosD = (deg: number): number => Math.cos(toRad(deg));
const tanD = (deg: number): number => Math.tan(toRad(deg));
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 지구 자전축 기울기 */
export const AXIAL_TILT = 23.44;

export const JEJU = { lat: 33.5, lon: 126.53, tzMeridian: 135 };

/** 1월 1일을 1로 세는 연중 일수 */
export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((today - start) / 86400000) + 1;
}

/** 태양 적위 */
export function declination(n: number): number {
  return AXIAL_TILT * sinD((360 * (284 + n)) / 365);
}

/** 균시차(분). 진태양시가 평균태양시보다 얼마나 빠른지 */
export function equationOfTime(n: number): number {
  const B = (360 * (n - 81)) / 364;
  return 9.87 * sinD(2 * B) - 7.53 * cosD(B) - 1.5 * sinD(B);
}

/** 시계 시각(분)을 진태양시(분)로 바꾼다 */
export function trueSolarTimeMin(clockMin: number, lon: number, n: number, tzMeridian = 135): number {
  return clockMin - (tzMeridian - lon) * 4 + equationOfTime(n);
}

/** 진태양시(분)에서 시각(時角). 남중이 0, 오전이 음수 */
export function hourAngle(trueSolarMin: number): number {
  return 15 * (trueSolarMin / 60 - 12);
}

/** 태양 고도 */
export function altitude(lat: number, decl: number, H: number): number {
  const s = sinD(lat) * sinD(decl) + cosD(lat) * cosD(decl) * cosD(H);
  return toDeg(Math.asin(clamp(s, -1, 1)));
}

/** 남중 고도. 위도가 적위보다 크다고 가정한다 */
export function transitAltitude(lat: number, decl: number): number {
  return clamp(90 - lat + decl, 0, 90);
}

/** 남중 시각(시계 시각, 분) */
export function transitClockMin(lon: number, n: number, tzMeridian = 135): number {
  return 720 + (tzMeridian - lon) * 4 - equationOfTime(n);
}

/** 낮의 길이(시간). 극야는 0, 백야는 24로 잘라 준다 */
export function dayLengthHours(lat: number, decl: number): number {
  const x = -tanD(lat) * tanD(decl);
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (2 * toDeg(Math.acos(x))) / 15;
}

/** 일출·일몰 시각(시계 시각, 분) */
export function sunriseSunsetMin(lat: number, lon: number, n: number): [number, number] {
  const transit = transitClockMin(lon, n);
  const half = (dayLengthHours(lat, declination(n)) * 60) / 2;
  return [transit - half, transit + half];
}

/** 남중 고도와 적위로 위도를 되돌린다 */
export function latitudeFromTransit(hmax: number, decl: number): number {
  return 90 - hmax + decl;
}

/**
 * 어떤 고도가 되는 시각을 진태양시(분)로 돌려준다.
 * 그 날 태양이 그 고도에 닿지 않으면 null.
 */
export function timeFromAltitude(alt: number, lat: number, decl: number, pm: boolean): number | null {
  const denom = cosD(lat) * cosD(decl);
  if (denom === 0) return null;
  const cosH = (sinD(alt) - sinD(lat) * sinD(decl)) / denom;
  if (cosH < -1 || cosH > 1) return null;
  const H = toDeg(Math.acos(cosH)) * (pm ? 1 : -1);
  return (H / 15 + 12) * 60;
}

/** 하루 동안의 고도 곡선. clockMin은 시계 시각(분) */
export function dayCurve(
  lat: number,
  lon: number,
  n: number,
  stepMin = 10,
): { clockMin: number; alt: number }[] {
  const decl = declination(n);
  const out: { clockMin: number; alt: number }[] = [];
  for (let clockMin = 0; clockMin <= 1440; clockMin += stepMin) {
    const H = hourAngle(trueSolarTimeMin(clockMin, lon, n));
    out.push({ clockMin, alt: altitude(lat, decl, H) });
  }
  return out;
}

/** 하지와 동지의 남중 고도 차이로 자전축 기울기를 구한다 */
export function axialTiltFromSolstices(hSummer: number, hWinter: number): number {
  return (hSummer - hWinter) / 2;
}

/**
 * 두 지점의 같은 날 같은 시각 남중 고도 차이로 지구 둘레를 구한다.
 * 두 지점의 경도가 비슷하다는 근사를 쓴다.
 */
export function earthCircumferenceKm(alt1: number, alt2: number, distanceKm: number): number {
  const diff = Math.abs(alt1 - alt2);
  if (diff === 0) return Infinity;
  return (360 * distanceKm) / diff;
}

/**
 * 이 남중 고도가 나오는 두 날짜(연중 일수).
 * 적위가 ±23.44°를 벗어나면 그런 날이 없으므로 null.
 */
export function datesForTransitAltitude(hmax: number, lat: number): [number, number] | null {
  const decl = hmax - 90 + lat;
  const ratio = decl / AXIAL_TILT;
  if (ratio < -1 || ratio > 1) return null;

  const theta1 = toDeg(Math.asin(ratio));
  const theta2 = 180 - theta1;
  const toDay = (theta: number): number => {
    const n = (theta * 365) / 360 - 284;
    return ((Math.round(n) % 365) + 365) % 365 || 365;
  };
  const a = toDay(theta1);
  const b = toDay(theta2);
  return a <= b ? [a, b] : [b, a];
}

/* ---------------------------------------------------------------
 * 하늘에서의 태양 위치 (고도 + 방위각)
 * ------------------------------------------------------------- */

/**
 * 태양의 방위각. 북쪽을 0도로 시계 방향으로 잰다.
 * 동쪽 90도, 남쪽 180도, 서쪽 270도.
 */
export function azimuth(lat: number, decl: number, H: number): number {
  const alt = altitude(lat, decl, H);
  const denom = cosD(alt) * cosD(lat);
  if (Math.abs(denom) < 1e-9) return 180;
  const cosA = (sinD(decl) - sinD(alt) * sinD(lat)) / denom;
  const A = toDeg(Math.acos(clamp(cosA, -1, 1)));
  // 오전(시각이 음수)은 동쪽, 오후는 서쪽
  return H > 0 ? 360 - A : A;
}

export type SunPoint = { clockMin: number; alt: number; az: number };

/** 하루 동안 태양이 하늘에 그리는 길. 지평선 아래는 빼고 준다 */
export function sunPath(lat: number, lon: number, n: number, stepMin = 5): SunPoint[] {
  const decl = declination(n);
  const out: SunPoint[] = [];
  for (let clockMin = 0; clockMin <= 1440; clockMin += stepMin) {
    const H = hourAngle(trueSolarTimeMin(clockMin, lon, n));
    const alt = altitude(lat, decl, H);
    if (alt < 0) continue;
    out.push({ clockMin, alt, az: azimuth(lat, decl, H) });
  }
  return out;
}

/** 어느 시각의 태양 위치 하나 */
export function sunAt(lat: number, lon: number, n: number, clockMin: number): SunPoint {
  const decl = declination(n);
  const H = hourAngle(trueSolarTimeMin(clockMin, lon, n));
  return { clockMin, alt: altitude(lat, decl, H), az: azimuth(lat, decl, H) };
}

/** 절기별 연중 일수. 계절을 견주어 볼 때 쓴다 */
export const SEASON_DAYS = { 하지: 172, 춘분: 80, 추분: 266, 동지: 355 } as const;
