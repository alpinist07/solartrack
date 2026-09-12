/**
 * 센서 없이 시연하기 위한 모의 신호. 실제 시리얼과 같은 문자열을 만들어
 * 같은 onLine 경로로 흘린다. 채널 순서는 A0(해 기준) A1 A2 A3.
 */

import { EZMAKER_4CH, shadowLength } from './shadow';

const DARK = 60;
const BRIGHT = 900;

/** 그림자 길이가 s일 때 네 채널이 볼 ADC 값 */
export function readingForShadow(s: number, cloud = false, noise = 8): string {
  const jitter = () => (Math.random() - 0.5) * 2 * noise;
  const clampAdc = (v: number) => Math.round(Math.min(1023, Math.max(0, v)));

  // A0은 해를 향해 있으므로 구름이 낄 때만 어두워진다
  const sun = clampAdc((cloud ? 330 : BRIGHT) + jitter());

  const rest = EZMAKER_4CH.sensorPosCm.map((x) => {
    // 경계에서 부드럽게 넘어가도록 반그림자를 1cm 폭으로 준다
    const t = Math.min(1, Math.max(0, x - s + 0.5));
    const base = DARK + (BRIGHT - DARK) * t;
    return clampAdc((cloud ? DARK + (base - DARK) * 0.25 + 260 : base) + jitter());
  });

  return [sun, ...rest].join(',');
}

/** 고도를 직접 주고 싶을 때 */
export function readingForAltitude(altDeg: number, cloud = false, noise = 8): string {
  return readingForShadow(shadowLength(EZMAKER_4CH.plateHeightCm, altDeg), cloud, noise);
}

/**
 * 2Hz로 삼각파를 그리며 값을 흘린다. 가끔 구름이 지나간다.
 * 25°~80°를 오가서 ok·beyond·inside·nolight가 모두 나타난다.
 */
export function startMock(onLine: (line: string) => void): () => void {
  let tick = 0;
  const id = setInterval(() => {
    tick += 1;
    const phase = (tick % 120) / 120;
    const tri = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    const alt = 25 + tri * 55;
    const cloud = tick % 120 >= 100 && tick % 120 < 112;
    onLine(readingForAltitude(alt, cloud));
  }, 500);
  return () => clearInterval(id);
}
