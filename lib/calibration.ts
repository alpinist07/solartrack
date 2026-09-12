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
