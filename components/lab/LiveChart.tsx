'use client';

import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useStore } from '@/store/useStore';

const config = {
  alt: { label: '태양 고도(도)', color: 'var(--chart-1)' },
  shadow: { label: '그림자 길이(cm)', color: 'var(--chart-2)' },
};

export function LiveChart() {
  const history = useStore((s) => s.history);
  const snapshot = useStore((s) => s.snapshot);

  const data = history.map((p) => ({
    time: new Date(p.t).toLocaleTimeString('ko-KR', { minute: '2-digit', second: '2-digit' }),
    alt: Number(p.alt.toFixed(1)),
    shadow: Number(p.shadow.toFixed(1)),
  }));

  return (
    <Card>
      <CardContent>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">최근 {data.length}개</p>
          <Button size="sm" variant="outline" onClick={snapshot} className="no-print">
            스냅샷
          </Button>
        </div>
        <ChartContainer config={config} className="h-[220px] w-full">
          <ComposedChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={40} fontSize={11} />
            <YAxis yAxisId="l" domain={[0, 90]} width={34} tickLine={false} axisLine={false} fontSize={11} />
            <YAxis yAxisId="r" orientation="right" width={34} tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line yAxisId="l" dataKey="alt" stroke="var(--color-alt)" dot={false} strokeWidth={2} isAnimationActive={false} />
            <Line yAxisId="r" dataKey="shadow" stroke="var(--color-shadow)" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
