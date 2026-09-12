'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CALIBRATION, normalize, type Calibration } from '@/lib/calibration';
import { parseLine } from '@/lib/parser';
import { DEFAULT_DEVICE, findBoundary, type Boundary, type DeviceConfig } from '@/lib/shadow';
import type { SerialState } from '@/lib/serial';

const CHART_POINTS = 120;
const MEDIAN_WINDOW = 5;

const median = (v: number[]): number => {
  const s = v.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type Point = { t: number; alt: number; shadow: number };
export type Snapshot = { t: number; alt: number; shadow: number; note?: string };

type State = {
  raw: number[];
  norm: number[];
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
      boundary: { kind: 'nolight' },
      history: [],
      snapshots: [],
      cal: DEFAULT_CALIBRATION,
      cfg: DEFAULT_DEVICE,
      serialState: 'closed',
      mock: false,
      message: '',

      onLine: (line) => {
        const raw = parseLine(line);
        if (!raw) return;
        const { cal, cfg, history } = get();
        const norm = normalize(raw, cal);
        const boundary = findBoundary(norm, cfg);

        let next = history;
        if (boundary.kind === 'ok') {
          // 태양이 튀지 않도록 최근 값의 중앙값을 쓴다
          const recent = [...history.slice(-(MEDIAN_WINDOW - 1)).map((p) => p.alt), boundary.altitudeDeg];
          next = [
            ...history,
            { t: Date.now(), alt: median(recent), shadow: boundary.shadowCm },
          ].slice(-CHART_POINTS);
        }
        set({ raw, norm, boundary, history: next });
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
      partialize: (s) => ({ cal: s.cal, cfg: s.cfg, snapshots: s.snapshots }),
    },
  ),
);
