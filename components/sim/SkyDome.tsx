'use client';

import {
  SEASON_DAYS,
  declination,
  sunAt,
  sunPath,
  transitAltitude,
  transitClockMin,
  type SunPoint,
} from '@/lib/solar';

/*
 * 하늘을 펼쳐 본 그림. 가로는 방위(동 90 - 남 180 - 서 270), 세로는 고도(0~90).
 * 오늘 궤적을 앰버로, 하지·동지 궤적을 회색으로 겹쳐 계절 차이를 한눈에 보인다.
 */

const W = 760;
const H = 380;
const PAD_L = 34;
const PAD_R = 14;
const PAD_T = 16;
const HORIZON = 320;

const AZ_MIN = 45;
const AZ_MAX = 315;

const xOf = (az: number) => PAD_L + ((az - AZ_MIN) / (AZ_MAX - AZ_MIN)) * (W - PAD_L - PAD_R);
const yOf = (alt: number) => HORIZON - (alt / 90) * (HORIZON - PAD_T);

const pathOf = (pts: SunPoint[]) =>
  pts.length === 0
    ? ''
    : pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.az).toFixed(1)},${yOf(p.alt).toFixed(1)}`).join(' ');

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;

type Props = { lat: number; lon: number; dayOfYear: number; clockMin: number };

export function SkyDome({ lat, lon, dayOfYear, clockMin }: Props) {
  const today = sunPath(lat, lon, dayOfYear);
  const summer = sunPath(lat, lon, SEASON_DAYS.하지);
  const winter = sunPath(lat, lon, SEASON_DAYS.동지);
  const sun = sunAt(lat, lon, dayOfYear, clockMin);

  const hmax = transitAltitude(lat, declination(dayOfYear));
  const transit = transitClockMin(lon, dayOfYear);
  const up = sun.alt > 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="하늘에서 태양이 지나가는 길">
      {/* 하늘과 땅 */}
      <rect x="0" y="0" width={W} height={110} fill="#dbeafe" />
      <rect x="0" y="110" width={W} height={110} fill="#e0f2fe" />
      <rect x="0" y="220" width={W} height={HORIZON - 220} fill="#f0f9ff" />
      <rect x="0" y={HORIZON} width={W} height={H - HORIZON} fill="#f5f5f4" />

      {/* 고도 눈금 */}
      {[30, 60, 90].map((a) => (
        <g key={a}>
          <line x1={PAD_L} y1={yOf(a)} x2={W - PAD_R} y2={yOf(a)} stroke="#e7e5e4" strokeWidth="1" />
          <text x={PAD_L - 6} y={yOf(a) + 4} fontSize="11" fill="#a8a29e" textAnchor="end" className="num">
            {a}
          </text>
        </g>
      ))}

      {/* 방위 눈금 */}
      {[
        [90, '동'],
        [135, ''],
        [180, '남'],
        [225, ''],
        [270, '서'],
      ].map(([az, label]) => (
        <g key={az}>
          <line x1={xOf(az as number)} y1={PAD_T} x2={xOf(az as number)} y2={HORIZON} stroke="#e7e5e4" strokeWidth="1" />
          {label && (
            <text x={xOf(az as number)} y={HORIZON + 20} fontSize="13" fill="#57534e" textAnchor="middle">
              {label as string}
            </text>
          )}
        </g>
      ))}

      <line x1="0" y1={HORIZON} x2={W} y2={HORIZON} stroke="#a8a29e" strokeWidth="1.5" />

      {/* 계절 견주기 */}
      <path d={pathOf(summer)} fill="none" stroke="#d6d3d1" strokeWidth="2" strokeDasharray="4 4" />
      <path d={pathOf(winter)} fill="none" stroke="#d6d3d1" strokeWidth="2" strokeDasharray="4 4" />
      {summer.length > 0 && (
        <text x={xOf(180) + 8} y={yOf(transitAltitude(lat, 23.44)) - 8} fontSize="11" fill="#a8a29e">
          하지
        </text>
      )}
      {winter.length > 0 && (
        <text x={xOf(180) + 8} y={yOf(transitAltitude(lat, -23.44)) - 8} fontSize="11" fill="#a8a29e">
          동지
        </text>
      )}

      {/* 오늘 */}
      <path d={pathOf(today)} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

      {/* 지금 태양 */}
      {up && (
        <g style={{ transition: 'transform 300ms' }}>
          <circle cx={xOf(sun.az)} cy={yOf(sun.alt)} r="20" fill="#f59e0b" opacity="0.2" />
          <circle cx={xOf(sun.az)} cy={yOf(sun.alt)} r="11" fill="#f59e0b" />
          <line
            x1={xOf(sun.az)}
            y1={yOf(sun.alt)}
            x2={xOf(sun.az)}
            y2={HORIZON}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        </g>
      )}

      <text x={PAD_L} y={H - 10} fontSize="13" fill="#44403c">
        {up
          ? `고도 ${sun.alt.toFixed(1)}도 · 남중 ${hmax.toFixed(1)}도 (${hhmm(transit)})`
          : '지금은 해가 지평선 아래에 있어요'}
      </text>
    </svg>
  );
}
