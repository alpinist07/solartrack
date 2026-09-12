import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALIBRATION,
  calibrationQuality,
  contrast,
  lowContrastSensors,
  median,
  medianBySensor,
  normalize,
  withBright,
  withDark,
} from '../lib/calibration';
import { findBoundary } from '../lib/shadow';

describe('median', () => {
  it('홀수 개는 가운데 값', () => expect(median([3, 1, 2])).toBe(2));
  it('짝수 개는 가운데 두 값의 평균', () => expect(median([1, 2, 3, 4])).toBe(2.5));
  it('NaN은 빼고 센다', () => expect(median([1, NaN, 3])).toBe(2));
  it('값이 없으면 NaN', () => expect(median([])).toBeNaN());
});

describe('medianBySensor', () => {
  it('센서별로 중앙값을 낸다', () => {
    expect(medianBySensor([
      [10, 100],
      [20, 200],
      [30, 300],
    ])).toEqual([20, 200]);
  });
});

describe('normalize', () => {
  const cal = { dark: [100, 100, 100, 100, 100], bright: [900, 900, 900, 900, 900], at: 1 };

  it('그늘은 0, 빛은 1', () => {
    expect(normalize([100, 900, 500, 100, 900], cal)).toEqual([0, 1, 0.5, 0, 1]);
  });

  it('범위를 벗어나면 0~1로 자른다', () => {
    expect(normalize([50, 1000, 500, 500, 500], cal).slice(0, 2)).toEqual([0, 1]);
  });

  it('대비가 없는 센서는 NaN', () => {
    const broken = { ...cal, bright: [100, 900, 900, 900, 900] };
    expect(normalize([500, 500, 500, 500, 500], broken)[0]).toBeNaN();
  });

  it('NaN이 된 센서를 findBoundary가 건너뛴다', () => {
    const broken = { dark: [0, 0, 0, 0, 0], bright: [800, 0, 800, 800, 800], at: 1 };
    const b = findBoundary(normalize([80, 500, 560, 720, 760], broken));
    expect(b.kind).toBe('ok');
    if (b.kind !== 'ok') return;
    expect(b.pair).toEqual([0, 2]);
  });
});

describe('보정 절차', () => {
  it('2단계를 마치면 대비가 충분해 신뢰도가 높음', () => {
    const dark = withDark(DEFAULT_CALIBRATION, [[50, 52, 48, 51, 49], [50, 50, 50, 50, 50]]);
    expect(dark.at).toBeNull();

    const cal = withBright(dark, [[900, 910, 890, 905, 895], [900, 900, 900, 900, 900]], 1234);
    expect(cal.at).toBe(1234);
    expect(calibrationQuality(cal)).toBe('high');
    expect(lowContrastSensors(cal)).toEqual([]);
    expect(contrast(cal)[0]).toBeCloseTo(850, 0);
  });

  it('대비가 부족하면 낮음으로 경고한다', () => {
    const cal = withBright(
      withDark(DEFAULT_CALIBRATION, [[500, 500, 500, 500, 500]]),
      [[520, 900, 900, 900, 900]],
    );
    expect(calibrationQuality(cal)).toBe('low');
    expect(lowContrastSensors(cal)).toEqual([0]);
  });

  it('보정 전에는 none', () => {
    expect(calibrationQuality(DEFAULT_CALIBRATION)).toBe('none');
  });
});
