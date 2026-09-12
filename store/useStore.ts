'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_CALIBRATION,
  EMPTY_RANGE,
  normalizeAuto,
  updateAutoRange,
  type AutoRange,
  type Calibration,
} from '@/lib/calibration';
import { parseLine } from '@/lib/parser';
import { EZMAKER_4CH, findBoundary, type Boundary, type DeviceConfig } from '@/lib/shadow';
import type { SerialState } from '@/lib/serial';

const CHART_POINTS = 120;
const MEDIAN_WINDOW = 5;

/** A0이 이보다 어두우면 해가 가려진 것으로 본다 */
const SUN_PRESENT = 0.2;

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
  /** 채널마다 본 적 있는 값의 범위 */
  range: AutoRange;
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
  resetRange: () => void;
  snapshot: () => void;
  loadSeed: (rows: Snapshot[]) => void;
  clearSnapshots: () => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      raw: [],
      norm: [],
      sunNorm: NaN,
      range: EMPTY_RANGE,
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
        const { cfg, history } = get();

        // 보드마다 값의 크기가 달라서(실측은 0~35였다) 본 적 있는 범위로 정규화한다
        const range = updateAutoRange(get().range, raw);
        const allNorm = normalizeAuto(raw, range);
        const sunNorm = allNorm[0] ?? NaN;
        // A0은 거리를 재지 않으므로 경계 계산에서 뺀다
        const norm = allNorm.slice(1, 1 + cfg.sensorPosCm.length);

        const fromShadow = findBoundary(norm, cfg);
        // A0이 캄캄할 때만 가림으로 본다. A0이 틀려도 그림자 판정을 막지는 않는다
        const sunBlocked = Number.isFinite(sunNorm) && sunNorm < SUN_PRESENT;
        const boundary: Boundary =
          sunBlocked && fromShadow.kind !== 'ok' ? { kind: 'nolight' } : fromShadow;

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
        set({ raw, norm, sunNorm, range, boundary, history: next });
      },

      setSerialState: (serialState, message = '') => set({ serialState, message }),
      setMock: (mock) => set({ mock }),
      setCal: (cal) => set({ cal }),
      // 자리를 옮겼거나 조명이 바뀌면 범위를 다시 잡는다
      resetRange: () => set({ range: EMPTY_RANGE }),

      loadSeed: (rows) => set({ snapshots: rows }),
      clearSnapshots: () => set({ snapshots: [] }),

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
