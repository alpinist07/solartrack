'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { relativeEnergy } from '@/lib/shadow';
import { useStore } from '@/store/useStore';

export function BigNumbers() {
  const boundary = useStore((s) => s.boundary);
  const ok = boundary.kind === 'ok';
  const alt = ok ? boundary.altitudeDeg : null;

  const confidence = ok ? (boundary.confidence >= 0.4 ? '높음' : boundary.confidence >= 0.2 ? '보통' : '낮음') : null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="relative overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-1 bg-amber-500" aria-hidden="true" />
        <CardContent className="pl-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">태양 고도</p>
            {confidence && (
              <Badge variant="outline" className="font-normal">
                신뢰도 {confidence}
              </Badge>
            )}
          </div>
          <p className="num mt-1 text-[48px] leading-tight font-semibold">
            {alt === null ? '—' : alt.toFixed(1)}
            <span className="ml-1 text-xl font-normal text-muted-foreground">도</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">그림자 길이</p>
          <p className="num mt-1 text-[48px] leading-tight font-semibold">
            {ok ? boundary.shadowCm.toFixed(1) : '—'}
            <span className="ml-1 text-xl font-normal text-muted-foreground">cm</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">빛 에너지</p>
          <p className="num mt-1 text-[48px] leading-tight font-semibold">
            {alt === null ? '—' : (relativeEnergy(alt) * 100).toFixed(1)}
            <span className="ml-1 text-xl font-normal text-muted-foreground">%</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
