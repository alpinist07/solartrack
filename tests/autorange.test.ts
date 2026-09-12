import { describe, expect, it } from 'vitest';
import { EMPTY_RANGE, normalizeAuto, updateAutoRange } from '../lib/calibration';
import { EZMAKER_4CH, findBoundary } from '../lib/shadow';
import { parseLine } from '../lib/parser';

// 실측 로그(테스트-20260912-141235.csv)에서 뽑은 줄. 값이 0~35 범위다
const REAL_LINES = [
  '0,9,3,2',
  '2,9,5,3',
  '15,3,2,10',
  '13,3,2,9',
  '0,2,2,0',
  '2,32,34,20',
  '2,31,34,21',
  '0,4,10,5',
  '0,3,2,6',
];

describe('실측 값 범위', () => {
  it('보드가 0~1023이 아니라 0~35 범위로 보낸다', () => {
    const all = REAL_LINES.flatMap((l) => parseLine(l) ?? []);
    expect(Math.max(...all)).toBeLessThan(40);
  });

  it('고정 1023으로 나누면 전부 그늘이 되어 감지에 실패한다', () => {
    const raw = parseLine('2,32,34,20') as number[];
    const naive = raw.slice(1).map((v) => v / 1023);
    expect(findBoundary(naive, EZMAKER_4CH).kind).toBe('beyond');
  });
});

describe('자동 범위 보정', () => {
  const range = REAL_LINES.reduce(
    (acc, line) => updateAutoRange(acc, parseLine(line) as number[]),
    EMPTY_RANGE,
  );

  it('채널마다 본 적 있는 최소·최대를 기억한다', () => {
    expect(range.lo[1]).toBe(2);
    expect(range.hi[1]).toBe(32);
    expect(range.hi[2]).toBe(34);
  });

  it('범위를 익힌 뒤에는 밝은 줄이 전부 빛으로 잡힌다', () => {
    const raw = parseLine('2,32,34,20') as number[];
    const norm = normalizeAuto(raw, range).slice(1);
    expect(findBoundary(norm, EZMAKER_4CH).kind).toBe('inside');
  });

  it('그늘에서 빛으로 넘어가는 줄은 경계를 찾는다', () => {
    const raw = parseLine('2,3,20,34') as number[];
    const norm = normalizeAuto(raw, range).slice(1);
    const b = findBoundary(norm, EZMAKER_4CH);
    expect(b.kind).toBe('ok');
    if (b.kind !== 'ok') return;
    expect(b.shadowCm).toBeGreaterThan(5);
    expect(b.shadowCm).toBeLessThan(15);
  });

  it('폭이 좁은 채널은 NaN으로 두어 건너뛰게 한다', () => {
    const narrow = updateAutoRange(EMPTY_RANGE, [10, 10, 10, 10]);
    expect(normalizeAuto([10, 10, 10, 10], narrow).every(Number.isNaN)).toBe(true);
  });
});
