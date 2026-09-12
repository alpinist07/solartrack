'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';

export function SensorStrip() {
  // 셀렉터는 하나씩 고른다. 객체로 묶으면 매번 새 객체라 무한 루프가 난다
  const raw = useStore((s) => s.raw);
  const norm = useStore((s) => s.norm);
  const sunNorm = useStore((s) => s.sunNorm);
  const boundary = useStore((s) => s.boundary);
  const cfg = useStore((s) => s.cfg);

  const pair = boundary.kind === 'ok' ? boundary.pair : null;

  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">밝기센서 4개</p>

        {/* A0은 거리를 재지 않고 해가 떠 있는지만 본다 */}
        <div className="flex items-center gap-3 rounded-md border px-2 py-1.5">
          <span className="num w-7 text-sm text-muted-foreground">A0</span>
          <span className="w-14 text-right text-sm text-muted-foreground">해 기준</span>
          <Progress value={Number.isFinite(sunNorm) ? sunNorm * 100 : 0} className="h-2 flex-1" />
          <span className="num w-12 text-right text-sm">{raw[0] ?? '—'}</span>
          <span className="w-10 text-right text-sm text-muted-foreground">
            {!Number.isFinite(sunNorm) ? '—' : sunNorm >= 0.35 ? '맑음' : '가림'}
          </span>
        </div>

        {cfg.sensorPosCm.map((x, i) => {
          const n = norm[i];
          const valid = Number.isFinite(n);
          const inPair = pair !== null && (pair[0] === i || pair[1] === i);
          const state = !valid ? '고장' : n >= cfg.threshold ? '빛' : '그늘';
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${inPair ? 'ring-2 ring-amber-500' : ''}`}
            >
              <span className="num w-7 text-sm text-muted-foreground">A{i + 1}</span>
              <span className="num w-14 text-right text-sm text-muted-foreground">{x.toFixed(0)}cm</span>
              <Progress value={valid ? n * 100 : 0} className="h-2 flex-1" />
              <span className="num w-12 text-right text-sm">{raw[i + 1] ?? '—'}</span>
              <span className="w-10 text-right text-sm text-muted-foreground">{state}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
