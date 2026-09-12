import { describe, expect, it } from 'vitest';
import {
  JEJU,
  altitude,
  axialTiltFromSolstices,
  dayCurve,
  dayLengthHours,
  dayOfYear,
  datesForTransitAltitude,
  declination,
  earthCircumferenceKm,
  equationOfTime,
  hourAngle,
  latitudeFromTransit,
  sunriseSunsetMin,
  timeFromAltitude,
  transitAltitude,
  transitClockMin,
  trueSolarTimeMin,
} from '../lib/solar';

// docs/04-계산-사양.md §B 테스트 벡터
// 제주 lat 33.5, lon 126.53; 오차 ±0.5도 / ±3분 / ±0.1h

const { lat, lon } = JEJU;

/** 진태양시(분)를 시계 시각(분)으로 되돌린다 */
const toClockMin = (tst: number, n: number): number =>
  tst + (JEJU.tzMeridian - lon) * 4 - equationOfTime(n);

describe('dayOfYear', () => {
  it('1월 1일은 1', () => expect(dayOfYear(new Date(2025, 0, 1))).toBe(1));
  it('12월 31일은 365 (평년)', () => expect(dayOfYear(new Date(2025, 11, 31))).toBe(365));
  it('9월 12일은 255 (평년)', () => expect(dayOfYear(new Date(2025, 8, 12))).toBe(255));
});

describe('declination', () => {
  it('하지(172)는 23.44도', () => expect(declination(172)).toBeCloseTo(23.44, 1));
  it('동지(355)는 -23.44도', () => expect(declination(355)).toBeCloseTo(-23.44, 1));
  it('춘분 무렵(80)은 0도 근처', () => expect(declination(80)).toBeCloseTo(0, 0));
});

describe('equationOfTime', () => {
  it('9월 12일(255)은 약 4.6분', () => expect(equationOfTime(255)).toBeCloseTo(4.6, 1));
});

describe('transitAltitude', () => {
  it('제주 하지 79.9도', () => expect(transitAltitude(lat, 23.44)).toBeCloseTo(79.9, 1));
  it('제주 동지 33.1도', () => expect(transitAltitude(lat, -23.44)).toBeCloseTo(33.1, 1));
  it('제주 춘분 56.1도', () => expect(transitAltitude(lat, declination(80))).toBeCloseTo(56.1, 1));
  it('제주 9월 12일 59.9도', () => expect(transitAltitude(lat, declination(255))).toBeCloseTo(59.9, 1));
  it('0~90도로 자른다', () => {
    expect(transitAltitude(-80, -23.44)).toBeLessThanOrEqual(90);
    expect(transitAltitude(80, -23.44)).toBeGreaterThanOrEqual(0);
  });
});

describe('dayLengthHours', () => {
  it('제주 하지 14.2시간', () => expect(dayLengthHours(lat, 23.44)).toBeCloseTo(14.2, 1));
  it('제주 동지 9.8시간', () => expect(dayLengthHours(lat, -23.44)).toBeCloseTo(9.8, 1));
  it('백야는 24시간', () => expect(dayLengthHours(80, 23.44)).toBe(24));
  it('극야는 0시간', () => expect(dayLengthHours(80, -23.44)).toBe(0));
});

describe('transitClockMin', () => {
  it('9월 12일 749분 (12:29)', () => expect(transitClockMin(lon, 255)).toBeCloseTo(749, 0));
  it('하지 755분 (12:35)', () => expect(transitClockMin(lon, 172)).toBeCloseTo(755, 0));
});

describe('altitude', () => {
  // 문서의 "9/12 10:00 시계 시각 → 53.2도" 벡터는 문서 안의 다른 값과 맞지 않는다.
  // 같은 문서의 식(transitClockMin 749 = 12:29 포함)으로 계산하면 10:00은 44.0도이고
  // 53.2도가 되는 시각은 약 10:59다. 식이 명확하므로 식을 따른다.
  it('9월 12일 10:00 시계 시각은 44.0도', () => {
    const n = 255;
    const alt = altitude(lat, declination(n), hourAngle(trueSolarTimeMin(600, lon, n)));
    expect(alt).toBeCloseTo(44.0, 1);
  });

  it('9월 12일 53.2도가 되는 시각은 약 10:59', () => {
    const n = 255;
    const alt = altitude(lat, declination(n), hourAngle(trueSolarTimeMin(659, lon, n)));
    // 문서가 정한 허용 오차는 ±0.5도다
    expect(Math.abs(alt - 53.2)).toBeLessThan(0.5);
  });

  it('남중 시각에 남중 고도가 된다', () => {
    const n = 255;
    const alt = altitude(lat, declination(n), hourAngle(trueSolarTimeMin(transitClockMin(lon, n), lon, n)));
    expect(alt).toBeCloseTo(transitAltitude(lat, declination(n)), 1);
  });
});

describe('timeFromAltitude', () => {
  it('오전 53.2도는 시계 시각 약 10:59', () => {
    const tst = timeFromAltitude(53.2, lat, declination(255), false);
    expect(tst).not.toBeNull();
    expect(toClockMin(tst as number, 255)).toBeCloseTo(659, -0.5);
  });

  it('오전과 오후가 남중을 사이에 두고 대칭이다', () => {
    const decl = declination(255);
    const am = timeFromAltitude(50, lat, decl, false) as number;
    const pm = timeFromAltitude(50, lat, decl, true) as number;
    expect((am + pm) / 2).toBeCloseTo(720, 6);
  });

  it('그 날 닿지 않는 고도면 null', () => {
    expect(timeFromAltitude(89, lat, declination(255), false)).toBeNull();
  });

  it('altitude와 왕복한다', () => {
    const n = 255;
    const decl = declination(n);
    const clockMin = 600;
    const alt = altitude(lat, decl, hourAngle(trueSolarTimeMin(clockMin, lon, n)));
    const tst = timeFromAltitude(alt, lat, decl, false) as number;
    expect(toClockMin(tst, n)).toBeCloseTo(clockMin, 3);
  });
});

describe('latitudeFromTransit', () => {
  it('9월 12일 남중 59.9도에서 위도 33.5도', () => {
    expect(latitudeFromTransit(59.9, 3.42)).toBeCloseTo(33.5, 1);
  });
});

describe('axialTiltFromSolstices', () => {
  it('제주 하지 79.9도 · 동지 33.1도에서 23.4도', () => {
    expect(axialTiltFromSolstices(79.9, 33.1)).toBeCloseTo(23.4, 1);
  });
});

describe('earthCircumferenceKm', () => {
  it('제주-강원 445km, 고도차 4도에서 약 40,050km', () => {
    expect(earthCircumferenceKm(59.9, 55.9, 445)).toBeCloseTo(40050, -2.5);
  });
});

describe('sunriseSunsetMin', () => {
  it('일출과 일몰의 한가운데가 남중 시각이다', () => {
    const [rise, set] = sunriseSunsetMin(lat, lon, 255);
    expect((rise + set) / 2).toBeCloseTo(transitClockMin(lon, 255), 6);
  });

  it('일몰에서 일출을 빼면 낮 길이다', () => {
    const [rise, set] = sunriseSunsetMin(lat, lon, 172);
    expect((set - rise) / 60).toBeCloseTo(dayLengthHours(lat, declination(172)), 6);
  });
});

describe('dayCurve', () => {
  it('0시부터 24시까지 stepMin 간격으로 만든다', () => {
    const curve = dayCurve(lat, lon, 255, 10);
    expect(curve).toHaveLength(145);
    expect(curve[0].clockMin).toBe(0);
    expect(curve[curve.length - 1].clockMin).toBe(1440);
  });

  it('가장 높은 점이 남중 고도와 남중 시각에 있다', () => {
    const curve = dayCurve(lat, lon, 255, 1);
    const peak = curve.reduce((a, b) => (b.alt > a.alt ? b : a));
    expect(peak.alt).toBeCloseTo(transitAltitude(lat, declination(255)), 1);
    expect(peak.clockMin).toBeCloseTo(transitClockMin(lon, 255), -0.5);
  });
});

describe('datesForTransitAltitude', () => {
  it('제주 남중 59.9도는 9월 12일 무렵을 포함한 두 날짜', () => {
    const days = datesForTransitAltitude(59.9, lat);
    expect(days).not.toBeNull();
    const [a, b] = days as [number, number];
    expect(b).toBeCloseTo(255, -0.5);
    expect(a).toBeCloseTo(90, -0.5);
  });

  it('제주에서 불가능한 고도면 null', () => {
    expect(datesForTransitAltitude(89, lat)).toBeNull();
  });
});
