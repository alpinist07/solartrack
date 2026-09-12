'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DayCurveChart } from '@/components/sim/DayCurveChart';
import { SkyDome } from '@/components/sim/SkyDome';
import {
  SEASON_DAYS,
  dayLengthHours,
  declination,
  equationOfTime,
  sunriseSunsetMin,
  transitAltitude,
  transitClockMin,
} from '@/lib/solar';
import { useStore } from '@/store/useStore';

const PLACES = [
  { name: '제주', lat: 33.5, lon: 126.53 },
  { name: '서울', lat: 37.57, lon: 126.98 },
  { name: '적도', lat: 0, lon: 126.53 },
  { name: '시드니', lat: -33.87, lon: 151.21 },
];

const hhmm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** 연중 일수를 월·일로 바꾼다 (평년 기준) */
function monthDay(n: number): string {
  const d = new Date(2025, 0, 1);
  d.setDate(n);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function Simulator() {
  const [place, setPlace] = useState(PLACES[0]);
  const [day, setDay] = useState(255);
  const [clock, setClock] = useState(720);
  const [overlay, setOverlay] = useState(false);
  const snapshots = useStore((s) => s.snapshots);

  const decl = declination(day);
  const hmax = transitAltitude(place.lat, decl);
  const [rise, set] = sunriseSunsetMin(place.lat, place.lon, day);

  return (
    <div className="space-y-3">
      <Card>
        <CardContent>
          <SkyDome lat={place.lat} lon={place.lon} dayOfYear={day} clockMin={clock} />
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">날짜</span>
                <span className="num text-sm font-medium">{monthDay(day)}</span>
              </div>
              <Slider min={1} max={365} value={[day]} onValueChange={([v]) => setDay(v)} />
            </div>

            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">시각</span>
                <span className="num text-sm font-medium">{hhmm(clock)}</span>
              </div>
              <Slider min={0} max={1439} step={5} value={[clock]} onValueChange={([v]) => setClock(v)} />
            </div>

            <div>
              <p className="mb-2 text-sm text-muted-foreground">관측지</p>
              <ToggleGroup
                type="single"
                value={place.name}
                onValueChange={(v) => v && setPlace(PLACES.find((p) => p.name === v) ?? PLACES[0])}
                variant="outline"
                size="sm"
              >
                {PLACES.map((p) => (
                  <ToggleGroupItem key={p.name} value={p.name}>
                    {p.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div>
              <p className="mb-2 text-sm text-muted-foreground">절기로 가기</p>
              <ToggleGroup
                type="single"
                value={String(day)}
                onValueChange={(v) => v && setDay(Number(v))}
                variant="outline"
                size="sm"
              >
                {Object.entries(SEASON_DAYS).map(([name, n]) => (
                  <ToggleGroupItem key={name} value={String(n)}>
                    {name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <Fact label="남중 고도" value={`${hmax.toFixed(1)}도`} />
            <Fact label="남중 시각" value={hhmm(transitClockMin(place.lon, day))} />
            <Fact label="태양 적위" value={`${decl.toFixed(1)}도`} />
            <Fact label="낮 길이" value={`${dayLengthHours(place.lat, decl).toFixed(1)}시간`} />
            <Fact label="해 뜨는 시각" value={hhmm(rise)} />
            <Fact label="해 지는 시각" value={hhmm(set)} />
            <Fact label="균시차" value={`${equationOfTime(day).toFixed(1)}분`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">하루 동안의 고도 변화</p>
            <Button
              size="sm"
              variant={overlay ? 'default' : 'outline'}
              disabled={snapshots.length === 0}
              onClick={() => setOverlay((v) => !v)}
              className="no-print"
            >
              실측 겹치기 ({snapshots.length})
            </Button>
          </div>
          <DayCurveChart lat={place.lat} lon={place.lon} dayOfYear={day} overlay={overlay} />
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="num text-base font-medium">{value}</span>
    </div>
  );
}
