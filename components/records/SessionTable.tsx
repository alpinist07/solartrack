'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { seedSnapshots } from '@/data/seed';
import { relativeEnergy } from '@/lib/shadow';
import { useStore } from '@/store/useStore';

const hhmm = (t: number) =>
  new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

export function SessionTable() {
  const snapshots = useStore((s) => s.snapshots);
  const loadSeed = useStore((s) => s.loadSeed);
  const clearSnapshots = useStore((s) => s.clearSnapshots);

  const csv = () => {
    const rows = [
      '시각,태양고도(도),그림자길이(cm),빛에너지(%)',
      ...snapshots.map(
        (s) =>
          `${new Date(s.t).toISOString()},${s.alt.toFixed(1)},${s.shadow.toFixed(1)},${(relativeEnergy(s.alt) * 100).toFixed(1)}`,
      ),
    ].join('\n');
    // 엑셀이 한글을 깨뜨리지 않도록 BOM을 붙인다
    const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `태양관측-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">기록 {snapshots.length}개</p>
          <div className="no-print flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadSeed(seedSnapshots());
                toast('예시 데이터를 넣었어요');
              }}
            >
              예시 데이터 불러오기
            </Button>
            <Button size="sm" variant="outline" disabled={snapshots.length === 0} onClick={csv}>
              CSV 내보내기
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={snapshots.length === 0}
              onClick={() => {
                clearSnapshots();
                toast('기록을 비웠어요');
              }}
            >
              비우기
            </Button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            아직 기록이 없어요. 실험실 탭에서 [스냅샷]을 누르거나 예시 데이터를 불러오세요.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시각</TableHead>
                <TableHead className="text-right">태양 고도</TableHead>
                <TableHead className="text-right">그림자 길이</TableHead>
                <TableHead className="text-right">빛 에너지</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((s) => (
                <TableRow key={s.t}>
                  <TableCell className="num">{hhmm(s.t)}</TableCell>
                  <TableCell className="num text-right">{s.alt.toFixed(1)}도</TableCell>
                  <TableCell className="num text-right">{s.shadow.toFixed(1)}cm</TableCell>
                  <TableCell className="num text-right">{(relativeEnergy(s.alt) * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
