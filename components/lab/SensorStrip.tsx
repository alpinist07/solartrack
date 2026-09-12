'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';

export function SensorStrip() {
  const { raw, norm, boundary, cfg } = useStore((s) => ({
    raw: s.raw,
    norm: s.norm,
    boundary: s.boundary,
    cfg: s.cfg,
  }));

  const pair = boundary.kind === 'ok' ? boundary.pair : null;

  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">밝기센서 5개</p>
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
              <span className="num w-7 text-sm text-muted-foreground">A{i}</span>
              <span className="num w-14 text-right text-sm text-muted-foreground">{x.toFixed(1)}cm</span>
              <Progress value={valid ? n * 100 : 0} className="h-2 flex-1" />
              <span className="num w-12 text-right text-sm">{raw[i] ?? '—'}</span>
              <span className="w-10 text-right text-sm text-muted-foreground">{state}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
