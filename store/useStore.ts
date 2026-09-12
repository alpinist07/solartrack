'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CALIBRATION, normalize, type Calibration } from '@/lib/calibration';
import { parseLine } from '@/lib/parser';
import { EZMAKER_4CH, findBoundary, type Boundary, type DeviceConfig } from '@/lib/shadow';
import type { SerialState } from '@/lib/serial';

const CHART_POINTS = 120;
const MEDIAN_WINDOW = 5;

/** A0이 이보다 어두우면 해가 가려진 것으로 본다 */
const SUN_PRESENT = 0.35;

const median = (v: number[]): number => {
  const s = v.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type Point = { t: number; alt: number; shadow: number };
export type Snapshot = { t: number; alt: number; shadow: number; note?: string };

type State = {
  /** 들어온 모든 채널의 ADC 원값. 0번은 해 기준 센서 */
  raw: number[];
  /** 거리 센서만의 정규값 (A1~A3) */
  norm: number[];
  /** 해 기준 센서의 정규값 */
  sunNorm: number;
  boundary: Boundary;
  history: Point[];
  snapshots: Snapshot[];
  cal: Calibration;
  cfg: DeviceConfig;
  serialState: SerialState;
  mock: boolean;
  message: string;
  onLine: (line: string) => void;
  setSerialState: (s: SerialState, message?: string) => void;
  setMock: (v: boolean) => void;
  setCal: (c: Calibration) => void;
  snapshot: () => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      raw: [],
      norm: [],
      sunNorm: NaN,
      boundary: { kind: 'nolight' },
      history: [],
      snapshots: [],
      cal: DEFAULT_CALIBRATION,
      cfg: EZMAKER_4CH,
      serialState: 'closed',
      mock: false,
      message: '',

      onLine: (line) => {
        const raw = parseLine(line);
        if (!raw) return;
        const { cal, cfg, history } = get();

        const allNorm = normalize(raw, cal);
        const sunNorm = allNorm[0] ?? NaN;
        // A0은 거리를 재지 않으므로 경계 계산에서 뺀다
        const norm = allNorm.slice(1, 1 + cfg.sensorPosCm.length);

        // 해 기준 센서가 어두우면 그림자를 따질 상황이 아니다
        const boundary: Boundary =
          Number.isFinite(sunNorm) && sunNorm < SUN_PRESENT
            ? { kind: 'nolight' }
            : findBoundary(norm, cfg);

        let next = history;
        if (boundary.kind === 'ok') {
          // 태양이 튀지 않도록 최근 값의 중앙값을 쓴다
          const recent = [
            ...history.slice(-(MEDIAN_WINDOW - 1)).map((p) => p.alt),
            boundary.altitudeDeg,
          ];
          next = [...history, { t: Date.now(), alt: median(recent), shadow: boundary.shadowCm }].slice(
            -CHART_POINTS,
          );
        }
        set({ raw, norm, sunNorm, boundary, history: next });
      },

      setSerialState: (serialState, message = '') => set({ serialState, message }),
      setMock: (mock) => set({ mock }),
      setCal: (cal) => set({ cal }),

      snapshot: () => {
        const { boundary, snapshots } = get();
        if (boundary.kind !== 'ok') return;
        set({
          snapshots: [
            ...snapshots,
            { t: Date.now(), alt: boundary.altitudeDeg, shadow: boundary.shadowCm },
          ],
        });
      },
    }),
    {
      name: 'solartrack',
      // 5센서 시절에 저장된 설정을 쓰면 안 되므로 판을 올린다
      version: 2,
      migrate: (persisted, version) => {
        const saved = (persisted ?? {}) as Partial<
          Pick<State, 'cal' | 'cfg' | 'snapshots'>
        >;
        const snapshots = saved.snapshots ?? [];
        // 5센서 시절 설정과 보정값은 버리고 스냅샷만 살린다
        if (version < 2) return { cal: DEFAULT_CALIBRATION, cfg: EZMAKER_4CH, snapshots };
        return {
          cal: saved.cal ?? DEFAULT_CALIBRATION,
          cfg: saved.cfg ?? EZMAKER_4CH,
          snapshots,
        };
      },
      partialize: (s) => ({ cal: s.cal, cfg: s.cfg, snapshots: s.snapshots }),
    },
  ),
);
