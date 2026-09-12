/** 보드가 보내는 한 줄을 센서 5개의 ADC 값으로 바꾼다. 순수 함수 */

export const SENSOR_COUNT = 5;

/**
 * 받아들이는 형태 (docs/01이 없어 넉넉하게 읽는다)
 *   "12,34,56,78,90"
 *   "A0:12 A1:34 A2:56 A3:78 A4:90"
 *   "12 34 56 78 90"
 */
export function parseLine(line: string): number[] | null {
  const text = line.trim();
  if (!text) return null;

  const labeled = [...text.matchAll(/A([0-4])\s*[:=]\s*(-?\d+(?:\.\d+)?)/gi)];
  if (labeled.length > 0) {
    const out = new Array<number>(SENSOR_COUNT).fill(NaN);
    for (const m of labeled) out[Number(m[1])] = Number(m[2]);
    return out.some((v) => Number.isFinite(v)) ? out : null;
  }

  const nums = text
    .split(/[,\s;]+/)
    .filter((t) => t !== '')
    .map((t) => (/^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN));

  if (nums.length < SENSOR_COUNT) return null;
  const five = nums.slice(0, SENSOR_COUNT);
  return five.some((v) => Number.isFinite(v)) ? five : null;
}
