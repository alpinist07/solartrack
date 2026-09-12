'use client';

import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { INQUIRY_CARDS, NEED_LABEL, type InquiryCard } from '@/data/inquiryCards';
import { useStore } from '@/store/useStore';

export function InquiryGallery() {
  const snapshots = useStore((s) => s.snapshots);

  // 지금 가진 자료로 무엇이 열리는지 정한다
  const have = {
    snapshot: snapshots.length >= 1,
    day: snapshots.length >= 4,
    week: false,
    month: false,
    solstice: false,
    'other-school': false,
  } as const;

  const groups = [...new Set(INQUIRY_CARDS.map((c) => c.group))];
  const open = INQUIRY_CARDS.filter((c) => !c.hidden && have[c.needs]).length;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        기록이 쌓이면 탐구가 하나씩 열려요. 지금 {open}개가 열렸어요.
      </p>

      {groups.map((group) => (
        <section key={group}>
          <h3 className="mb-2 text-sm font-medium">{group}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INQUIRY_CARDS.filter((c) => c.group === group && !c.hidden).map((card) => (
              <CardTile key={card.id} card={card} unlocked={have[card.needs]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CardTile({ card, unlocked }: { card: InquiryCard; unlocked: boolean }) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${unlocked ? 'hover:border-amber-500' : 'opacity-50'}`}
      onClick={() => {
        if (unlocked) toast(card.method);
        else toast(`${NEED_LABEL[card.needs]}가 있어야 열려요`);
      }}
    >
      <CardContent className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="num text-xs text-muted-foreground">{card.id}</span>
          {!unlocked && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {NEED_LABEL[card.needs]}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium">{card.title}</p>
        <p className="text-sm text-muted-foreground">{card.question}</p>
      </CardContent>
    </Card>
  );
}
