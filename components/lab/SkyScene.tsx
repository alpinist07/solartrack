'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';

// 측면도 한 장. 방위각은 그리지 않는다. viewBox 720 x 420
const W = 720;
const H = 420;
const GROUND = 340;
/** 막대를 오른쪽으로 충분히 밀어야 왼쪽에 해가 들어갈 자리가 생긴다 */
const PLATE_X = 240;
const CM = 24; // 1cm = 24px. 막대 10cm, 센서는 15cm까지

/** 해가 이 선 안쪽에 들어오도록 거리를 줄인다 */
const MARGIN_X = 44;
const MARGIN_TOP = 36;
/** 자리가 넉넉할 때 쓰는 거리 */
const SUN_DIST = 260;
/** 고도 눈금을 그리는 거리 */
const TICK_DIST = 200;

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * 막대 밑동에서 고도 방향으로 해를 놓는다.
 * 거리를 고정하면 고도가 낮을 때 해가 화면 밖으로 나가므로,
 * 가로·세로 여백에 맞춰 거리를 줄인다.
 */
function sunPos(altDeg: number) {
  const c = Math.cos(rad(altDeg));
  const s = Math.sin(rad(altDeg));
  const maxByX = c > 0.001 ? (PLATE_X - MARGIN_X) / c : Infinity;
  const maxByY = s > 0.001 ? (GROUND - MARGIN_TOP) / s : Infinity;
  const r = Math.min(SUN_DIST, maxByX, maxByY);
  return { x: PLATE_X - r * c, y: GROUND - r * s };
}

export function SkyScene() {
  const boundary = useStore((s) => s.boundary);
  const cfg = useStore((s) => s.cfg);

  const angles = cfg.sensorAngleDeg;
  const lowest = Math.min(...angles);
  const highest = Math.max(...angles);

  // 잰 값이 없을 때도 해를 그린다. 다만 정확한 값이 아니라고 알린다
  const measured = boundary.kind === 'ok';
  const displayAlt =
    boundary.kind === 'ok'
      ? boundary.altitudeDeg
      : boundary.kind === 'beyond'
        ? lowest
        : boundary.kind === 'inside'
          ? highest
          : 45;

  const shadow = measured ? boundary.shadowCm : null;
  const plateTop = GROUND - cfg.plateHeightCm * CM;
  const sun = sunPos(displayAlt);

  // 그림자가 화면을 넘지 않도록 자른다
  const shadowW = shadow === null ? 0 : Math.min(shadow * CM, W - PLATE_X - 8);

  const message =
    boundary.kind === 'ok'
      ? `그림자가 ${boundary.shadowCm.toFixed(1)}cm까지 뻗었어요`
      : boundary.kind === 'beyond'
        ? `해가 ${lowest.toFixed(0)}도보다 낮아요. 그림자가 센서 밖으로 나갔어요`
        : boundary.kind === 'inside'
          ? `해가 ${highest.toFixed(0)}도보다 높아요. 그림자가 첫 센서 안쪽에 있어요`
          : '빛을 찾지 못했어요';

  return (
    <Card>
      <CardContent>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={message}>
          <rect x="0" y="0" width={W} height="120" fill="#dbeafe" />
          <rect x="0" y="120" width={W} height="120" fill="#e0f2fe" />
          <rect x="0" y="240" width={W} height={GROUND - 240} fill="#f0f9ff" />
          <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="#f5f5f4" />

          {/* 고도 10도 눈금 */}
          {[10, 20, 30, 40, 50, 60, 70, 80].map((a) => {
            const x = PLATE_X - TICK_DIST * Math.cos(rad(a));
            const y = GROUND - TICK_DIST * Math.sin(rad(a));
            return (
              <g key={a}>
                <circle cx={x} cy={y} r="1.5" fill="#a8a29e" />
                <text x={x - 5} y={y + 4} fontSize="10" fill="#a8a29e" textAnchor="end" className="num">
                  {a}
                </text>
              </g>
            );
          })}

          <line x1="0" y1={GROUND} x2={W} y2={GROUND} stroke="#a8a29e" strokeWidth="1.5" />

          {boundary.kind === 'nolight' ? (
            <g>
              <ellipse cx={sun.x} cy={sun.y} rx="54" ry="26" fill="#e7e5e4" />
              <ellipse cx={sun.x - 26} cy={sun.y + 6} rx="30" ry="18" fill="#e7e5e4" />
            </g>
          ) : (
            <g>
              <line
                x1={sun.x}
                y1={sun.y}
                x2={PLATE_X}
                y2={plateTop}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                opacity={measured ? 1 : 0.45}
              />
              <circle cx={sun.x} cy={sun.y} r="22" fill="#f59e0b" opacity={measured ? 0.2 : 0.1} />
              {measured ? (
                <circle cx={sun.x} cy={sun.y} r="14" fill="#f59e0b" />
              ) : (
                // 잰 값이 아니라 짐작한 자리라서 속을 비워 둔다
                <circle
                  cx={sun.x}
                  cy={sun.y}
                  r="14"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
              <text x={sun.x} y={sun.y - 26} fontSize="12" fill="#b45309" textAnchor="middle" className="num">
                {measured ? `${displayAlt.toFixed(1)}도` : `${displayAlt.toFixed(0)}도 밖`}
              </text>
            </g>
          )}

          {/* 가림판 */}
          <rect x={PLATE_X - 3} y={plateTop} width="6" height={GROUND - plateTop} fill="#44403c" />
          <text x={PLATE_X - 10} y={plateTop - 6} fontSize="11" fill="#57534e" textAnchor="end" className="num">
            {cfg.plateHeightCm.toFixed(1)}cm
          </text>

          {/* 그림자 띠 */}
          {shadow !== null && (
            <rect
              x={PLATE_X}
              y={GROUND}
              width={shadowW}
              height="14"
              fill="#57534e"
              opacity="0.35"
              style={{ transition: 'width 300ms' }}
            />
          )}

          {/* 센서 */}
          {cfg.sensorPosCm.map((x, i) => {
            const cx = PLATE_X + x * CM;
            const lit = shadow !== null && x > shadow;
            return (
              <g key={i}>
                <circle cx={cx} cy={GROUND + 24} r="6" fill={lit ? '#f59e0b' : '#a8a29e'} />
                <text x={cx} y={GROUND + 46} fontSize="10" fill="#78716c" textAnchor="middle">
                  A{i + 1}
                </text>
                <text x={cx} y={GROUND + 60} fontSize="9" fill="#a8a29e" textAnchor="middle" className="num">
                  {x}cm
                </text>
              </g>
            );
          })}

          <text x="16" y={H - 10} fontSize="14" fill="#44403c">
            {message}
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
