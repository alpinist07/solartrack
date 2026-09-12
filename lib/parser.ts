/** 보드가 보내는 한 줄을 채널별 ADC 값으로 바꾼다. 순수 함수 */

/** 채널 수는 보드에 따라 다르다. 최소 이만큼은 있어야 한 줄로 인정한다 */
export const MIN_CHANNELS = 2;

/**
 * 받아들이는 형태 (docs/01이 없어 넉넉하게 읽는다)
 *   "12,34,56,78"
 *   "A0:12 A1:34 A2:56 A3:78"
 *   "12 34 56 78"
 * 채널 개수는 고정하지 않고 들어온 만큼 돌려준다.
 */
export function parseLine(line: string): number[] | null {
  const text = line.trim();
  if (!text) return null;

  const labeled = [...text.matchAll(/A(\d)\s*[:=]\s*(-?\d+(?:\.\d+)?)/gi)];
  if (labeled.length > 0) {
    const size = Math.max(...labeled.map((m) => Number(m[1]))) + 1;
    const out = new Array<number>(size).fill(NaN);
    for (const m of labeled) out[Number(m[1])] = Number(m[2]);
    return out.some(Number.isFinite) ? out : null;
  }

  const nums = text
    .split(/[,\s;]+/)
    .filter((t) => t !== '')
    .map((t) => (/^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN));

  if (nums.length < MIN_CHANNELS) return null;
  return nums.some(Number.isFinite) ? nums : null;
}
