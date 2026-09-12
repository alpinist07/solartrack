/**
 * 센서 보정. 밝기센서의 ADC 원값을 0~1 정규값으로 바꾼다.
 * 브라우저 API와 React에 의존하지 않는 순수 함수만 둔다.
 *
 * 주의: 보정 절차의 세부 사양은 docs/01-측정기-하드웨어-프로토콜.md에 있다.
 * 그 문서가 아직 없어 2점 보정(그늘 기준 · 빛 기준)으로 구현했다.
 */

export const SENSOR_COUNT = 5;

/** 대비가 이보다 작으면 경계를 믿을 수 없다 */
export const MIN_CONTRAST = 100;

export type Calibration = {
  /** 전부 그늘일 때의 센서별 ADC 값 */
  dark: number[];
  /** 전부 빛일 때의 센서별 ADC 값 */
  bright: number[];
  /** 보정을 마친 시각(ms). 없으면 아직 보정 전 */
  at: number | null;
};

export const DEFAULT_CALIBRATION: Calibration = {
  dark: new Array(SENSOR_COUNT).fill(0),
  bright: new Array(SENSOR_COUNT).fill(1023),
  at: null,
};

export type CalibrationQuality = 'none' | 'low' | 'high';

/** 여러 번 읽은 값의 센서별 중앙값 */
export function medianBySensor(samples: number[][]): number[] {
  if (samples.length === 0) return [];
  const count = samples[0].length;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const col = samples.map((s) => s[i]).filter((v) => Number.isFinite(v));
    out.push(median(col));
  }
  return out;
}

/** 값 하나짜리 중앙값. 빈 배열이면 NaN */
export function median(values: number[]): number {
  const v = values.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  if (v.length === 0) return NaN;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** 센서별 빛과 그늘의 차이 */
export function contrast(cal: Calibration): number[] {
  return cal.bright.map((b, i) => b - (cal.dark[i] ?? 0));
}

/** 보정 상태. 대비가 부족하면 'low' */
export function calibrationQuality(cal: Calibration): CalibrationQuality {
  if (cal.at === null) return 'none';
  return contrast(cal).every((c) => c >= MIN_CONTRAST) ? 'high' : 'low';
}

/** 대비가 부족한 센서 번호들 */
export function lowContrastSensors(cal: Calibration): number[] {
  return contrast(cal)
    .map((c, i) => (c < MIN_CONTRAST ? i : -1))
    .filter((i) => i >= 0);
}

/**
 * ADC 원값을 0~1로 정규화한다.
 * 대비가 0 이하인 센서는 믿을 수 없으므로 NaN을 돌려준다.
 * findBoundary가 NaN인 센서를 건너뛴다.
 */
export function normalize(raw: number[], cal: Calibration): number[] {
  return raw.map((v, i) => {
    const dark = cal.dark[i] ?? 0;
    const bright = cal.bright[i] ?? 1023;
    const span = bright - dark;
    if (!Number.isFinite(v) || span <= 0) return NaN;
    return Math.min(1, Math.max(0, (v - dark) / span));
  });
}

/** 보정 1단계: 전부 그늘로 만든 상태의 값을 기록한다 */
export function withDark(cal: Calibration, samples: number[][]): Calibration {
  return { ...cal, dark: medianBySensor(samples), at: null };
}

/** 보정 2단계: 전부 빛을 받는 상태의 값을 기록한다 */
export function withBright(cal: Calibration, samples: number[][], now = Date.now()): Calibration {
  return { ...cal, bright: medianBySensor(samples), at: now };
}

/* ---------------------------------------------------------------
 * 자동 범위 보정
 *
 * 보드가 보내는 값의 크기가 기기마다 다르다. 실측 로그에서는 0~1023이 아니라
 * 0~35 범위였다. 고정된 최대값으로 나누면 전부 그늘로 판정된다.
 * 그래서 흘러 들어온 값의 최소·최대를 채널마다 기억해 그 폭으로 정규화한다.
 * 학생이 보정 절차를 몰라도 막대를 한 번 움직이면 범위가 잡힌다.
 * ------------------------------------------------------------- */

/** 채널별로 본 적 있는 가장 어두운 값과 밝은 값 */
export type AutoRange = { lo: number[]; hi: number[] };

export const EMPTY_RANGE: AutoRange = { lo: [], hi: [] };

/** 이 폭보다 좁으면 빛과 그늘을 가를 수 없다고 본다 (원값 기준) */
export const MIN_SPAN = 4;

/** 새 값을 보고 범위를 넓힌다. 순수 함수 */
export function updateAutoRange(prev: AutoRange, raw: number[]): AutoRange {
  const lo = raw.slice();
  const hi = raw.slice();
  for (let i = 0; i < raw.length; i++) {
    const v = raw[i];
    if (!Number.isFinite(v)) {
      lo[i] = prev.lo[i] ?? NaN;
      hi[i] = prev.hi[i] ?? NaN;
      continue;
    }
    const pLo = prev.lo[i];
    const pHi = prev.hi[i];
    lo[i] = Number.isFinite(pLo) ? Math.min(pLo, v) : v;
    hi[i] = Number.isFinite(pHi) ? Math.max(pHi, v) : v;
  }
  return { lo, hi };
}

/**
 * 본 적 있는 범위로 0~1 정규화한다.
 * 아직 폭이 좁은 채널은 NaN을 돌려 findBoundary가 건너뛰게 한다.
 */
export function normalizeAuto(raw: number[], range: AutoRange): number[] {
  return raw.map((v, i) => {
    const lo = range.lo[i];
    const hi = range.hi[i];
    if (!Number.isFinite(v) || !Number.isFinite(lo) || !Number.isFinite(hi)) return NaN;
    const span = hi - lo;
    if (span < MIN_SPAN) return NaN;
    return Math.min(1, Math.max(0, (v - lo) / span));
  });
}
