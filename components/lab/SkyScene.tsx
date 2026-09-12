'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';

// 측면도 한 장. 방위각은 그리지 않는다. viewBox 720 x 420
const W = 720;
const H = 420;
const GROUND = 340;
const PLATE_X = 150;
const CM = 9; // 1cm = 9px

export function SkyScene() {
  const boundary = useStore((s) => s.boundary);
  const cfg = useStore((s) => s.cfg);

  const ok = boundary.kind === 'ok';
  const alt = ok ? boundary.altitudeDeg : null;
  const shadow = ok ? boundary.shadowCm : null;
  const plateTop = GROUND - cfg.plateHeightCm * CM;

  // 태양은 가림판 꼭대기에서 고도만큼 올려다본 방향에 둔다
  const r = 250;
  const sunX = alt === null ? PLATE_X - r * 0.7 : PLATE_X - r * Math.cos((alt * Math.PI) / 180);
  const sunY = alt === null ? GROUND - r * 0.5 : GROUND - r * Math.sin((alt * Math.PI) / 180);

  const message =
    boundary.kind === 'ok'
      ? `그림자가 ${boundary.shadowCm.toFixed(1)}cm까지 뻗었어요`
      : boundary.kind === 'beyond'
        ? '해가 너무 낮아요. 그림자가 센서 밖으로 나갔어요'
        : boundary.kind === 'inside'
          ? '해가 너무 높아요. 그림자가 첫 센서 안쪽에 있어요'
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
            const x = PLATE_X - 300 * Math.cos((a * Math.PI) / 180);
            const y = GROUND - 300 * Math.sin((a * Math.PI) / 180);
            return (
              <g key={a}>
                <circle cx={x} cy={y} r="1.5" fill="#a8a29e" />
                <text x={x - 4} y={y - 6} fontSize="10" fill="#a8a29e" textAnchor="end">
                  {a}
                </text>
              </g>
            );
          })}

          <line x1="0" y1={GROUND} x2={W} y2={GROUND} stroke="#a8a29e" strokeWidth="1.5" />

          {boundary.kind === 'nolight' ? (
            <g>
              <ellipse cx={sunX} cy={sunY} rx="54" ry="26" fill="#e7e5e4" />
              <ellipse cx={sunX - 26} cy={sunY + 6} rx="30" ry="18" fill="#e7e5e4" />
            </g>
          ) : (
            <g style={{ transition: 'transform 300ms' }}>
              <circle cx={sunX} cy={sunY} r="22" fill="#f59e0b" opacity="0.2" />
              <circle cx={sunX} cy={sunY} r="14" fill="#f59e0b" />
              <line
                x1={sunX}
                y1={sunY}
                x2={PLATE_X}
                y2={plateTop}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
            </g>
          )}

          {/* 가림판 */}
          <rect x={PLATE_X - 3} y={plateTop} width="6" height={GROUND - plateTop} fill="#44403c" />
          <text x={PLATE_X - 10} y={plateTop - 6} fontSize="11" fill="#57534e" textAnchor="end">
            {cfg.plateHeightCm.toFixed(1)}cm
          </text>

          {/* 그림자 띠 */}
          {shadow !== null && (
            <rect
              x={PLATE_X}
              y={GROUND}
              width={shadow * CM}
              height="14"
              fill="#57534e"
              opacity="0.35"
              style={{ transition: 'width 300ms' }}
            />
          )}

          {/* 센서 5개 */}
          {cfg.sensorPosCm.map((x, i) => {
            const cx = PLATE_X + x * CM;
            const lit = shadow !== null && x > shadow;
            return (
              <g key={i}>
                <circle cx={cx} cy={GROUND + 24} r="6" fill={lit ? '#f59e0b' : '#a8a29e'} />
                <text x={cx} y={GROUND + 46} fontSize="10" fill="#78716c" textAnchor="middle">
                  A{i}
                </text>
              </g>
            );
          })}

          <text x="16" y={H - 12} fontSize="14" fill="#44403c">
            {message}
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
