/**
 * 탐구 카드 18개. 태양고도-탐구주제.md §1의 주제를 그대로 따른다.
 * needs는 잠금 해제 조건으로, §4.1의 축적량 표를 옮긴 것이다.
 */

export type Need = 'snapshot' | 'day' | 'week' | 'month' | 'solstice' | 'other-school';

export type InquiryCard = {
  id: number;
  title: string;
  group: string;
  /** 초등 6학년이 읽을 한 문장 */
  question: string;
  method: string;
  needs: Need;
  /** 14번은 심화라 기본으로 감춘다 */
  hidden?: boolean;
};

export const NEED_LABEL: Record<Need, string> = {
  snapshot: '스냅샷 1개',
  day: '하루치 기록',
  week: '일주일 기록',
  month: '한 달 기록',
  solstice: '하지와 동지 기록',
  'other-school': '다른 학교 자료',
};

export const INQUIRY_CARDS: InquiryCard[] = [
  {
    id: 1,
    title: '우리 학교의 위도',
    group: '바로 계산되는 것',
    question: '남중 고도만 재면 우리가 지구 어디쯤 있는지 알 수 있을까?',
    method: '위도 = 90도 − 남중 고도 + 태양 적위',
    needs: 'snapshot',
  },
  {
    id: 2,
    title: '지구가 기울어진 정도',
    group: '바로 계산되는 것',
    question: '여름과 겨울의 남중 고도 차이가 말해 주는 것은?',
    method: '하지와 동지의 남중 고도 차이를 2로 나눈다',
    needs: 'solstice',
  },
  {
    id: 3,
    title: '우리 학교의 경도',
    group: '바로 계산되는 것',
    question: '해가 가장 높이 뜨는 때가 왜 정확히 12시가 아닐까?',
    method: '남중 시각과 정오의 차이. 4분이 1도',
    needs: 'week',
  },
  {
    id: 4,
    title: '나무와 건물의 키',
    group: '바로 계산되는 것',
    question: '사다리 없이 학교 건물 높이를 잴 수 있을까?',
    method: '그림자 길이 × tan(태양 고도)',
    needs: 'snapshot',
  },
  {
    id: 5,
    title: '그림자 끝이 그리는 선',
    group: '시간을 두고 보는 것',
    question: '하루 동안 그림자 끝을 점으로 찍으면 무슨 모양이 될까?',
    method: '춘분·추분에는 곧은 선, 다른 날에는 굽은 선',
    needs: 'day',
  },
  {
    id: 6,
    title: '남중 시각이 날마다 달라져요',
    group: '시간을 두고 보는 것',
    question: '해가 가장 높은 시각이 날마다 조금씩 움직이는 까닭은?',
    method: '날마다 남중 시각을 적어 균시차와 견준다',
    needs: 'week',
  },
  {
    id: 7,
    title: '아날렘마',
    group: '시간을 두고 보는 것',
    question: '1년 동안 같은 시각의 해를 찍으면 8자가 나온다는데 정말일까?',
    method: '매일 같은 시각의 고도와 방위를 기록한다',
    needs: 'month',
  },
  {
    id: 8,
    title: '낮 길이와 남중 고도',
    group: '시간을 두고 보는 것',
    question: '해가 높이 뜨는 날은 낮도 길까?',
    method: '두 값을 나란히 놓고 정말 같이 움직이는지 본다',
    needs: 'month',
  },
  {
    id: 9,
    title: '가장 더운 때는 정오가 아니에요',
    group: '다른 것과 이어보기',
    question: '해가 가장 높은 때와 가장 더운 때가 왜 다를까?',
    method: '고도가 가장 높은 시각과 기온이 가장 높은 시각을 견준다',
    needs: 'day',
  },
  {
    id: 10,
    title: '여름은 6월인데 더위는 8월',
    group: '다른 것과 이어보기',
    question: '하지가 지났는데 왜 8월이 더 더울까?',
    method: '9번을 한 해 단위로 넓혀서 본다',
    needs: 'solstice',
  },
  {
    id: 11,
    title: '햇빛이 주는 에너지',
    group: '다른 것과 이어보기',
    question: '해가 높을수록 정말 더 뜨거울까?',
    method: '고도와 빛 에너지(sin 고도)를 견준다',
    needs: 'day',
  },
  {
    id: 12,
    title: '여름에 더운 건 지구가 가까워서일까',
    group: '다른 것과 이어보기',
    question: '지구가 태양에 가장 가까운 때는 1월인데, 왜 1월이 춥지?',
    method: '내가 잰 고도 자료와 지구-태양 거리 자료를 나란히 놓는다',
    needs: 'solstice',
  },
  {
    id: 13,
    title: '태양광 패널을 몇 도로 세울까',
    group: '생활에 쓰기',
    question: '해를 가장 많이 받으려면 판을 어떻게 기울여야 할까?',
    method: '지금은 90도 − 고도, 한 해 평균은 위도만큼',
    needs: 'snapshot',
  },
  {
    id: 14,
    title: '처마 길이 정하기',
    group: '생활에 쓰기',
    question: '여름 볕은 막고 겨울 볕은 들이는 처마는 얼마나 길어야 할까?',
    method: '하지와 동지의 고도로 처마 길이를 계산한다. 한옥의 원리',
    needs: 'solstice',
    hidden: true,
  },
  {
    id: 15,
    title: '학교 화단 햇빛 지도',
    group: '생활에 쓰기',
    question: '화단에서 해가 가장 잘 드는 자리는 어디일까?',
    method: '계절마다 볕 드는 시간을 재어 지도로 만든다',
    needs: 'month',
  },
  {
    id: 16,
    title: '해시계 만들기',
    group: '생활에 쓰기',
    question: '그림자만 보고 몇 시인지 알 수 있을까?',
    method: '우리 위도에 맞춰 바늘 각도를 정한다',
    needs: 'day',
  },
  {
    id: 17,
    title: '지구 둘레 재기',
    group: '다른 학교와 함께',
    question: '2200년 전 에라토스테네스처럼 지구 크기를 잴 수 있을까?',
    method: '위도가 다른 학교와 같은 날 남중 고도를 주고받는다',
    needs: 'other-school',
  },
  {
    id: 18,
    title: '남반구는 계절이 반대예요',
    group: '다른 학교와 함께',
    question: '우리가 여름일 때 시드니는 왜 겨울일까?',
    method: '남반구 학교와 고도 자료를 주고받아 견준다',
    needs: 'other-school',
  },
];
