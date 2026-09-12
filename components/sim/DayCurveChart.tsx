'use client';

import { CartesianGrid, Line, LineChart, ReferenceDot, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { dayCurve } from '@/lib/solar';
import { useStore } from '@/store/useStore';

const config = {
  alt: { label: '태양 고도(도)', color: 'var(--chart-1)' },
};

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

type Props = { lat: number; lon: number; dayOfYear: number; overlay: boolean };

export function DayCurveChart({ lat, lon, dayOfYear, overlay }: Props) {
  const snapshots = useStore((s) => s.snapshots);

  const data = dayCurve(lat, lon, dayOfYear, 10)
    .filter((p) => p.alt >= 0)
    .map((p) => ({ clockMin: p.clockMin, time: hhmm(p.clockMin), alt: Number(p.alt.toFixed(1)) }));

  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <LineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={48} fontSize={11} />
        <YAxis domain={[0, 90]} width={34} tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="alt" stroke="var(--color-alt)" dot={false} strokeWidth={2} isAnimationActive={false} />
        {overlay &&
          snapshots.map((s) => {
            const d = new Date(s.t);
            const min = Math.round((d.getHours() * 60 + d.getMinutes()) / 10) * 10;
            return (
              <ReferenceDot
                key={s.t}
                x={hhmm(min)}
                y={Number(s.alt.toFixed(1))}
                r={4}
                fill="#57534e"
                stroke="none"
              />
            );
          })}
      </LineChart>
    </ChartContainer>
  );
}
