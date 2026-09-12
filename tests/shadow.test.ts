import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DEVICE,
  DIFFUSE_MAX,
  altitudeFromShadow,
  findBoundary,
  relativeEnergy,
  sensorPosForAngle,
  shadowLength,
  spreadFactor,
} from '../lib/shadow';

// docs/04-계산-사양.md §A 테스트 벡터 (h = 25)

describe('shadowLength', () => {
  it('30도에서 43.3cm', () => expect(shadowLength(25, 30)).toBeCloseTo(43.3, 1));
  it('50도에서 21.0cm', () => expect(shadowLength(25, 50)).toBeCloseTo(21.0, 1));
  it('70도에서 9.1cm', () => expect(shadowLength(25, 70)).toBeCloseTo(9.1, 1));
  it('80도에서 4.4cm', () => expect(shadowLength(25, 80)).toBeCloseTo(4.4, 1));
});

describe('altitudeFromShadow', () => {
  it('17.8cm에서 54.5도', () => expect(altitudeFromShadow(25, 17.8)).toBeCloseTo(54.5, 1));

  it('shadowLength와 왕복한다', () => {
    for (const alt of [30, 40, 50, 60, 70, 80]) {
      expect(altitudeFromShadow(25, shadowLength(25, alt))).toBeCloseTo(alt, 6);
    }
  });
});

describe('sensorPosForAngle', () => {
  it('기본 담당각이 기본 센서 위치와 맞는다', () => {
    DEFAULT_DEVICE.sensorAngleDeg.forEach((angle, i) => {
      expect(sensorPosForAngle(25, angle)).toBeCloseTo(DEFAULT_DEVICE.sensorPosCm[i], 1);
    });
  });
});

describe('findBoundary', () => {
  it('ok: 경계를 선형보간한다', () => {
    const b = findBoundary([0.08, 0.19, 0.62, 0.94, 0.96], DEFAULT_DEVICE);
    expect(b.kind).toBe('ok');
    if (b.kind !== 'ok') return;
    expect(b.shadowCm).toBeCloseTo(19.16, 1);
    expect(b.altitudeDeg).toBeCloseTo(52.5, 1);
    expect(b.pair).toEqual([1, 2]);
    expect(b.confidence).toBeCloseTo(0.43, 2);
  });

  it('beyond: 전부 그늘', () => {
    const b = findBoundary([0.05, 0.1, 0.2, 0.3, 0.4], DEFAULT_DEVICE);
    expect(b.kind).toBe('beyond');
    if (b.kind !== 'beyond') return;
    expect(b.maxAltitudeDeg).toBe(30);
  });

  it('inside: 전부 빛', () => {
    const b = findBoundary([0.9, 0.92, 0.95, 0.97, 0.98], DEFAULT_DEVICE);
    expect(b.kind).toBe('inside');
    if (b.kind !== 'inside') return;
    expect(b.minAltitudeDeg).toBe(70);
  });

  it('nolight: 밝기가 고른데 어두우면 빛을 못 찾은 것', () => {
    expect(findBoundary([0.55, 0.6, 0.58, 0.62, 0.6], DEFAULT_DEVICE).kind).toBe('nolight');
  });

  // 두 경우 모두 "전부 임계값 이상 + 퍼짐 0.2 미만"이라 밝기 수준으로만 갈린다
  it('밝기가 고를 때 DIFFUSE_MAX가 nolight와 inside를 가른다', () => {
    const dim = DIFFUSE_MAX - 0.05;
    const bright = DIFFUSE_MAX + 0.05;
    expect(findBoundary([dim, dim, dim, dim, dim], DEFAULT_DEVICE).kind).toBe('nolight');
    expect(findBoundary([bright, bright, bright, bright, bright], DEFAULT_DEVICE).kind).toBe('inside');
  });

  it('NaN 센서를 건너뛰고 인접 유효 센서끼리 쌍을 만든다', () => {
    const b = findBoundary([0.1, NaN, 0.7, 0.9, 0.95], DEFAULT_DEVICE);
    expect(b.kind).toBe('ok');
    if (b.kind !== 'ok') return;
    expect(b.pair).toEqual([0, 2]);
  });

  it('전부 NaN이면 nolight', () => {
    expect(findBoundary([NaN, NaN, NaN, NaN, NaN], DEFAULT_DEVICE).kind).toBe('nolight');
  });

  it('cfg를 생략하면 DEFAULT_DEVICE를 쓴다', () => {
    expect(findBoundary([0.08, 0.19, 0.62, 0.94, 0.96]).kind).toBe('ok');
  });
});

describe('relativeEnergy / spreadFactor', () => {
  it('54.5도에서 0.814', () => expect(relativeEnergy(54.5)).toBeCloseTo(0.814, 3));
  it('54.5도에서 1.23배', () => expect(spreadFactor(54.5)).toBeCloseTo(1.23, 2));
  it('90도에서 에너지 1, 퍼짐 1배', () => {
    expect(relativeEnergy(90)).toBeCloseTo(1, 6);
    expect(spreadFactor(90)).toBeCloseTo(1, 6);
  });
});
