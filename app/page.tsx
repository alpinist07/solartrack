'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BigNumbers } from '@/components/lab/BigNumbers';
import { LiveChart } from '@/components/lab/LiveChart';
import { SensorStrip } from '@/components/lab/SensorStrip';
import { SkyScene } from '@/components/lab/SkyScene';
import { startMock } from '@/lib/mock';
import { EzmakerSerial } from '@/lib/serial';
import { useStore } from '@/store/useStore';

const STATE_LABEL: Record<string, string> = {
  closed: '연결 안 됨',
  connecting: '연결하는 중',
  connected: '연결됨',
  reading: '받는 중',
  lost: '연결 끊김',
};

export default function Page() {
  const [supported, setSupported] = useState(true);
  const serialRef = useRef<EzmakerSerial | null>(null);
  const stopMockRef = useRef<(() => void) | null>(null);

  const { onLine, setSerialState, serialState, mock, setMock } = useStore((s) => ({
    onLine: s.onLine,
    setSerialState: s.setSerialState,
    serialState: s.serialState,
    mock: s.mock,
    setMock: s.setMock,
  }));

  useEffect(() => {
    setSupported(EzmakerSerial.supported);
    if (!EzmakerSerial.supported) return;
    const s = new EzmakerSerial({
      onLine,
      onState: (state, message) => {
        setSerialState(state, message);
        if (state === 'lost') toast.error('연결이 끊겼어요. [장치 연결]을 다시 눌러 주세요');
      },
    });
    serialRef.current = s;
    // 이미 허락한 포트가 있으면 조용히 다시 잡는다
    void s.reconnect().catch(() => {});
    return () => {
      void s.disconnect();
    };
  }, [onLine, setSerialState]);

  // 모의 모드도 실제 시리얼과 같은 onLine 경로를 쓴다
  useEffect(() => {
    if (!mock) {
      stopMockRef.current?.();
      stopMockRef.current = null;
      return;
    }
    stopMockRef.current = startMock(onLine);
    return () => stopMockRef.current?.();
  }, [mock, onLine]);

  const connected = serialState === 'connected' || serialState === 'reading';
  const reading = serialState === 'reading';

  return (
    <div className="mx-auto min-h-svh w-full max-w-6xl px-4 py-6">
      <header className="no-print mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-3">
          <SunMark />
          <h1 className="text-lg font-semibold tracking-tight">제주 태양 관측소</h1>
        </div>

        <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${
              reading ? 'animate-pulse bg-amber-500' : connected ? 'bg-amber-500' : 'bg-stone-300'
            }`}
          />
          {mock ? '모의 모드' : (STATE_LABEL[serialState] ?? '연결 안 됨')}
        </Badge>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!supported}
            onClick={async () => {
              try {
                if (connected) await serialRef.current?.disconnect();
                else await serialRef.current?.connect();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : '연결하지 못했어요');
              }
            }}
          >
            {connected ? '연결 해제' : '장치 연결'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!connected}
            onClick={async () => {
              if (reading) await serialRef.current?.stop();
              else serialRef.current?.start();
            }}
          >
            {reading ? '수신 중지' : '수신 시작'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast('보정은 3단계에서 넣습니다')}>
            보정
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={mock} onCheckedChange={setMock} aria-label="모의 모드" />
            모의 모드
          </label>
        </div>
      </header>

      {!supported && (
        <Alert className="no-print mb-5">
          <AlertTitle>이 브라우저에서는 장치를 연결할 수 없어요</AlertTitle>
          <AlertDescription>
            Chrome 또는 Edge에서 열어 주세요. 지금은 모의 모드로 볼 수 있어요.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="lab">
        <TabsList className="no-print">
          <TabsTrigger value="lab">실험실</TabsTrigger>
          <TabsTrigger value="sim">시뮬레이터</TabsTrigger>
          <TabsTrigger value="inquiry">탐구</TabsTrigger>
          <TabsTrigger value="records">기록</TabsTrigger>
        </TabsList>

        <TabsContent value="lab" className="mt-4 space-y-3">
          <BigNumbers />
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <SkyScene />
            <SensorStrip />
          </div>
          <LiveChart />
        </TabsContent>
        <TabsContent value="sim">
          <Placeholder>5단계에서 날짜와 위도를 바꾸는 시뮬레이터가 들어옵니다.</Placeholder>
        </TabsContent>
        <TabsContent value="inquiry">
          <Placeholder>6단계에서 탐구 카드 18개가 들어옵니다.</Placeholder>
        </TabsContent>
        <TabsContent value="records">
          <Placeholder>7단계에서 기록 표와 내보내기가 들어옵니다.</Placeholder>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** 로고. 장식이 아니라 관측소를 가리키는 표시라서 아이콘 대신 직접 그린다 */
function SunMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="5" className="fill-amber-500" />
      <g className="stroke-amber-500" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.5" y2="12" />
      </g>
    </svg>
  );
}
