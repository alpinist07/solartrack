/**
 * 그림자 길이와 태양 고도 계산.
 * 브라우저 API와 React에 의존하지 않는 순수 함수만 둔다.
 * 각도 인자와 반환값은 모두 도(°). 라디안은 이 파일 안에서만 쓴다.
 */

const DEG = Math.PI / 180;

const toRad = (deg: number): number => deg * DEG;
const toDeg = (rad: number): number => rad / DEG;

export type DeviceConfig = {
  plateHeightCm: number;
  sensorPosCm: number[];
  sensorAngleDeg: number[];
  threshold: number;
};

export const DEFAULT_DEVICE: DeviceConfig = {
  plateHeightCm: 25,
  sensorPosCm: [9.1, 14.4, 21.0, 29.8, 43.3],
  sensorAngleDeg: [70, 60, 50, 40, 30],
  threshold: 0.5,
};

/**
 * 밝기가 고르면서 이 값보다 어두우면 햇빛이 아니라 퍼진 빛으로 본다.
 *
 * docs/04의 규칙 2(nolight)와 규칙 3(inside)은 둘 다 "전부 임계값 이상 + 퍼짐 0.2 미만"이라
 * 문서의 두 테스트 벡터를 구분하지 못한다. 실제로 갈리는 것은 밝기 수준이다.
 * nolight 벡터는 0.55~0.62, inside 벡터는 0.90~0.98이므로 그 사이를 기준으로 삼는다.
 */
export const DIFFUSE_MAX = 0.75;

export type Boundary =
  | { kind: 'ok'; shadowCm: number; altitudeDeg: number; pair: [number, number]; confidence: number }
  /** 전부 그늘: 고도가 담당각 최소(30°)보다 낮다 */
  | { kind: 'beyond'; maxAltitudeDeg: number }
  /** 전부 빛: 고도가 담당각 최대(70°)보다 높다 */
  | { kind: 'inside'; minAltitudeDeg: number }
  | { kind: 'nolight' };

/** 높이 h인 가림판이 고도 altDeg의 햇빛에서 만드는 그림자 길이 */
export function shadowLength(h: number, altDeg: number): number {
  return h / Math.tan(toRad(altDeg));
}

/** 그림자 길이 s로부터 태양 고도를 되돌린다 */
export function altitudeFromShadow(h: number, s: number): number {
  return toDeg(Math.atan(h / s));
}

/** 담당각 angleDeg를 맡는 센서가 놓여야 할 거리 */
export function sensorPosForAngle(h: number, angleDeg: number): number {
  return shadowLength(h, angleDeg);
}

/** 태양 고도에 따른 상대 빛 에너지 (0~1) */
export function relativeEnergy(altDeg: number): number {
  return Math.sin(toRad(altDeg));
}

/** 같은 빛다발이 퍼지는 넓이의 배율 */
export function spreadFactor(altDeg: number): number {
  return 1 / Math.sin(toRad(altDeg));
}

/**
 * 정규화된 센서값 배열에서 그늘과 빛의 경계를 찾는다.
 * NaN인 센서는 건너뛰고 인접한 유효 센서끼리 쌍을 만든다.
 */
export function findBoundary(n: number[], cfg: DeviceConfig = DEFAULT_DEVICE): Boundary {
  const thr = cfg.threshold;

  // 1. 유효한 센서만 원래 인덱스와 함께 남긴다
  const valid: { i: number; v: number; x: number }[] = [];
  for (let i = 0; i < n.length; i++) {
    const v = n[i];
    if (typeof v === 'number' && Number.isFinite(v)) {
      valid.push({ i, v, x: cfg.sensorPosCm[i] });
    }
  }
  if (valid.length === 0) return { kind: 'nolight' };

  const values = valid.map((p) => p.v);
  const max = Math.max(...values);
  const min = Math.min(...values);

  // 2. 밝기가 고른데 햇빛이라기엔 어두우면 빛을 못 찾은 것으로 본다
  if (values[0] >= thr && max - min < 0.2 && max < DIFFUSE_MAX) return { kind: 'nolight' };

  // 3. 전부 빛
  if (values.every((v) => v >= thr)) {
    return { kind: 'inside', minAltitudeDeg: Math.max(...cfg.sensorAngleDeg) };
  }

  // 4. 전부 그늘
  if (values.every((v) => v < thr)) {
    return { kind: 'beyond', maxAltitudeDeg: Math.min(...cfg.sensorAngleDeg) };
  }

  // 5. 그늘에서 빛으로 넘어가는 첫 쌍에서 선형보간
  for (let k = 0; k < valid.length - 1; k++) {
    const a = valid[k];
    const b = valid[k + 1];
    if (a.v < thr && thr <= b.v) {
      const s = a.x + ((b.x - a.x) * (thr - a.v)) / (b.v - a.v);
      return {
        kind: 'ok',
        shadowCm: s,
        altitudeDeg: altitudeFromShadow(cfg.plateHeightCm, s),
        pair: [a.i, b.i],
        confidence: b.v - a.v,
      };
    }
  }

  return { kind: 'nolight' };
}
