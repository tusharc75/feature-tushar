import { normalizeRange, fmt, TimeRange } from 'src/pages/PlanningView/GanttView/utils';

type WindowKey = string;

type WindowState = {
  loadedSkips: Set<number>;
  hasMore: boolean; // true until server returns < limit for a skip
};

export type Params = {
  skip: number;
  limit: number;
  date: { from: string; to: string };
};

export class VisibleWindowPager {
  private limit: number;

  // Per-window loaded pages (by skip)
  private state = new Map<WindowKey, WindowState>();

  // Scroll + layout state
  private hasMoreData = true;
  private groupHeights: number[] = [];
  private clientHeight = 0;
  private scrollHeight = 0;
  private scrollTop = 0;
  private totalGroups = 0;

  // Derived/cached
  private dirty = true;
  private derivedHeights: number[] = [];
  private prefixSums: number[] = [];

  constructor(limit: number) {
    this.limit = limit;
  }

  // ========== Public API ==========

  setGroupItemHeight(index: number, height: number) {
    this.groupHeights[index] = height;
    this.dirty = true;
  }

  setScrollData({ clientHeight, scrollHeight, scrollTop }: { clientHeight: number; scrollHeight: number; scrollTop: number }) {
    this.clientHeight = clientHeight;
    this.scrollHeight = scrollHeight;
    this.scrollTop = scrollTop;
    this.dirty = true;
  }

  setTotalGroups(groups: number) {
    this.totalGroups = Math.max(0, groups | 0);
    this.dirty = true;
    this.hasMoreData = this.groupHeights.length < this.totalGroups;
  }

  // window key normalized to day boundaries
  key(range: TimeRange): WindowKey {
    const n = normalizeRange(range);
    return `${fmt(n.start)}__${fmt(n.end)}`;
  }

  reset(range?: TimeRange) {
    if (!range) {
      this.state.clear();
      return;
    }
    this.state.delete(this.key(range));
  }

  /**
   * Compute the next request params needed so that the currently
   * visible group rows are backed by data.
   * - On initial call (all zeros/empty), return the first page (skip=0).
   * - Otherwise, compute visible page range and return the first missing page.
   * Returns null if nothing new is needed.
   */
  getParamsForVisible(range: TimeRange, opts?: { prefetchPx?: number; skipLimit?: boolean }): Params | null {
    const n = normalizeRange(range);
    const windowKey = this.key(n);
    const win = this.ensureWindowState(windowKey);

    // New window or all-zeros initial -> first page
    const isInitial =
      this.clientHeight === 0 && this.scrollHeight === 0 && this.scrollTop === 0 && this.totalGroups === 0 && this.groupHeights.length === 0;

    if (isInitial || win.loadedSkips.size === 0) {
      if (!win.loadedSkips.has(0)) return this.buildParams(n, 0);
      // if we already loaded skip 0, continue to visible math
    }

    this.recomputeIfDirty();

    // Compute indices with prefetch margin
    const prefetchPx = Math.max(0, opts?.prefetchPx ?? 0);
    const { startIdx, endIdx } = this.getVisibleIndices(prefetchPx);

    if (startIdx === -1 || endIdx === -1) {
      // No computable viewport; try a safe fallback (first page if not loaded)
      console.log({ startIdx, endIdx, this: this, skip: opts.skipLimit ? skip : startIdx + 1 });
      if (!win.loadedSkips.has(0)) return this.buildParams(n, opts.skipLimit ? 0 : startIdx + 1);
      return null;
    }

    const firstSkip = Math.floor(startIdx / this.limit) * this.limit;
    const lastSkip = Math.floor(endIdx / this.limit) * this.limit;

    for (let skip = firstSkip; skip <= lastSkip; skip += this.limit) {
      if (!win.loadedSkips.has(skip)) {
        console.log({ startIdx, endIdx, this: this, skip: opts.skipLimit ? skip : startIdx + 1 });
        return this.buildParams(n, opts.skipLimit ? skip : startIdx + 1);
      }
    }

    return null;
  }

  // Call after each successful fetch to register the page as loaded
  // and update hasMore for the current window (based on server count).
  markResult(range: TimeRange, skip: number, returnedCount: number) {
    const key = this.key(range);
    const win = this.ensureWindowState(key);
    win.loadedSkips.add(skip);
    if (returnedCount < this.limit) win.hasMore = false;
  }

  // ========== Internals ==========

  private ensureWindowState(key: WindowKey): WindowState {
    let win = this.state.get(key);
    if (!win) {
      win = { loadedSkips: new Set<number>(), hasMore: true };
      this.state.set(key, win);
    }
    return win;
  }

  private recomputeIfDirty() {
    if (!this.dirty) return;

    const knownHeights = this.groupHeights.filter((h) => Number.isFinite(h) && h > 0);
    const avg = knownHeights.length ? knownHeights.reduce((a, b) => a + b, 0) / knownHeights.length : 48;

    const estimatedTotal =
      this.totalGroups > 0
        ? this.totalGroups
        : avg > 0 && this.scrollHeight > 0
          ? Math.max(this.groupHeights.length, Math.max(1, Math.round(this.scrollHeight / avg)))
          : this.groupHeights.length;

    this.totalGroups = Math.max(0, estimatedTotal | 0);

    this.derivedHeights = new Array(this.totalGroups);
    for (let i = 0; i < this.totalGroups; i++) {
      const h = this.groupHeights[i];
      this.derivedHeights[i] = Number.isFinite(h) && h > 0 ? (h as number) : avg;
    }

    this.prefixSums = new Array(this.totalGroups);
    let acc = 0;
    for (let i = 0; i < this.totalGroups; i++) {
      acc += this.derivedHeights[i];
      this.prefixSums[i] = acc;
    }

    this.dirty = false;
  }

  private getVisibleIndices(prefetchPx = 0): { startIdx: number; endIdx: number } {
    this.recomputeIfDirty();

    if (this.totalGroups === 0 || this.clientHeight <= 0) {
      return { startIdx: -1, endIdx: -1 };
    }

    const top = Math.max(0, this.scrollTop);
    const rawBottom = top + this.clientHeight + prefetchPx;

    const totalHeight = this.prefixSums.length ? this.prefixSums[this.prefixSums.length - 1] : 0;
    const bottom = Math.min(totalHeight, rawBottom);

    const startIdx = this.lowerBoundPrefix(top + 1);
    const endIdx = Math.min(this.totalGroups - 1, this.lowerBoundPrefix(bottom));

    return { startIdx, endIdx };
  }

  // Binary search on prefixSums to find first index i with prefixSums[i] >= value
  private lowerBoundPrefix(value: number): number {
    let lo = 0;
    let hi = this.prefixSums.length - 1;
    let ans = this.prefixSums.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this.prefixSums[mid] >= value) {
        ans = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return ans;
  }

  private buildParams(n: TimeRange, skip: number): Params {
    return {
      skip,
      limit: this.limit,
      date: {
        from: fmt(n.start),
        to: fmt(n.end)
      }
    };
  }
}
