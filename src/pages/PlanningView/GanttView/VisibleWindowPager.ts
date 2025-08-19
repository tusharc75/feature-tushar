type DateRange = { start: Date; end: Date };

export type Params = {
  skip: number;
  limit: number;
  date: { from: string; to: string };
};

interface PagerOptions {
  limit: number; // max groups to request per call
  hasMoreData?: boolean;
  groupHeights?: number[]; // pixel heights per group row
  clientHeight?: number; // viewport height
  scrollHeight?: number; // full scrollable height
  scrollTop?: number; // pixels scrolled from top
  overscan?: number; // optional buffer above/below viewport, in groups
}

type Interval = { from: number; to: number }; // inclusive [from, to] in ms

export class VisibleWindowPager {
  private limit: number;
  private hasMoreData: boolean;

  private groupHeights: number[] = [];
  private prefixHeights: number[] = []; // prefix sums for binary search

  private clientHeight = 0;
  private scrollHeight = 0;
  private scrollTop = 0;

  private overscan: number;

  // Loaded intervals are always merged and sorted per group.
  private loadedByGroup: Map<number, Interval[]> = new Map();
  // Pending intervals can be overlapping; we merge on-the-fly for coverage checks.
  private pendingByGroup: Map<number, Interval[]> = new Map();

  constructor(opts: PagerOptions) {
    this.limit = Math.max(1, opts.limit);
    this.hasMoreData = opts.hasMoreData ?? true;
    this.overscan = Math.max(0, opts.overscan ?? 1);

    if (opts.groupHeights) this.setGroupHeights(opts.groupHeights);
    if (opts.clientHeight !== undefined || opts.scrollHeight !== undefined || opts.scrollTop !== undefined) {
      this.setScrollMetrics({
        clientHeight: opts.clientHeight ?? this.clientHeight,
        scrollHeight: opts.scrollHeight ?? this.scrollHeight,
        scrollTop: opts.scrollTop ?? this.scrollTop
      });
    }
  }

  // --- Public setters -------------------------------------------------------

  setLimit(limit: number) {
    this.limit = Math.max(1, limit | 0);
  }

  setHasMoreData(hasMore: boolean) {
    this.hasMoreData = !!hasMore;
  }

  setGroupHeights(heights: number[]) {
    this.groupHeights = heights.map((h) => Math.max(0, h | 0));
    this.rebuildPrefixHeights();
  }

  setScrollMetrics(args: { clientHeight: number; scrollHeight: number; scrollTop: number }) {
    this.clientHeight = Math.max(0, args.clientHeight | 0);
    this.scrollHeight = Math.max(0, args.scrollHeight | 0);
    this.scrollTop = Math.max(0, args.scrollTop | 0);
  }

  // --- Core API -------------------------------------------------------------

  /**
   * Computes the request payload for the currently visible window.
   * On initial call (all metrics are zero), returns { skip: 0, limit, date }.
   * On subsequent calls, returns the first contiguous block of visible groups
   * that do NOT have full coverage of the requested range (loaded or pending).
   * If all visible groups already cover the range, returns null.
   */
  getParamsForVisible(range: DateRange): Params | null {
    const dateISO = this.dateISO(range);
    const { fromMs, toMs } = this.rangeMs(range);

    // Initial call: when everything is 0, immediately request first page.
    if (this.isInitialZeroState()) {
      this.markPending(fromMs, toMs, 0, this.limit);
      return { skip: 0, limit: this.limit, date: dateISO };
    }

    // If no groups, nothing to do.
    const total = this.groupHeights.length;
    if (total === 0) return null;

    const [vStart, vEnd] = this.getVisibleIndices();
    if (vStart > vEnd) return null;

    const missing = this.findContiguousMissingCoverage(fromMs, toMs, vStart, vEnd, this.limit);
    if (!missing) return null;

    const [skip, count] = missing;
    this.markPending(fromMs, toMs, skip, count);

    return { skip, limit: count, date: dateISO };
  }

  getParamsForNextPage(range: DateRange): Params {
    const dateISO = this.dateISO(range);
    const [, vEnd] = this.getVisibleIndices();
    return { skip: vEnd, limit: this.limit, date: dateISO };
  }

  /**
   * Parent should call this after a request completes to update internal state.
   * Pass the same skip/limit and date that were returned by getParamsForVisible.
   * On success, expands the loaded coverage intervals for each involved group.
   */
  onRequestResult(args: { date: { from: string; to: string }; skip: number; limit: number; ok: boolean }) {
    const fromMs = new Date(args.date.from).getTime();
    const toMs = new Date(args.date.to).getTime();
    const start = Math.max(0, args.skip | 0);
    const end = start + Math.max(0, args.limit | 0) - 1;

    for (let i = start; i <= end; i++) {
      // Remove pending instance for this exact interval
      this.removePendingInterval(i, fromMs, toMs);

      if (args.ok) {
        // Merge into loaded coverage
        const merged = this.mergeIntoLoaded(i, fromMs, toMs);
        this.loadedByGroup.set(i, merged);
      }
    }
  }

  crateKey({ date, skip }: { date: { from: string; to: string }; skip: number; limit?: number }) {
    return `${date.from.toString()}_${date.to.toString()}__skip:${skip}`;
  }

  getAllGroupsHeightCombined() {
    return this.groupHeights.reduce((acc, curr) => acc + curr, 0);
  }

  reset(
    opts: {
      clearLoaded?: boolean;
      clearPending?: boolean;
      resetScroll?: boolean;
    } = {}
  ) {
    const { clearLoaded = true, clearPending = true, resetScroll = true } = opts;

    if (clearPending) this.pendingByGroup.clear();
    if (clearLoaded) this.loadedByGroup.clear();
    if (resetScroll) {
      this.scrollTop = 0;
      this.clientHeight = 0;
      this.scrollHeight = 0;
    }
  }

  // --- Helpers: coverage and intervals -------------------------------------

  private rangeMs(range: DateRange) {
    const a = range.start.getTime();
    const b = range.end.getTime();
    const fromMs = Math.min(a, b);
    const toMs = Math.max(a, b);
    return { fromMs, toMs };
  }

  private intervalsFor(map: Map<number, Interval[]>, index: number): Interval[] {
    return map.get(index) ?? [];
  }

  private setIntervals(map: Map<number, Interval[]>, index: number, intervals: Interval[]) {
    if (intervals.length) map.set(index, intervals);
    else map.delete(index);
  }

  private isFullyCovered(index: number, fromMs: number, toMs: number): boolean {
    // Loaded intervals are merged — quick check
    const loaded = this.intervalsFor(this.loadedByGroup, index);
    if (this.isCoveredBy(loaded, fromMs, toMs)) return true;

    // Pending might be fragmented — merge a copy to check union coverage
    const pending = this.intervalsFor(this.pendingByGroup, index);
    if (!pending.length) return false;
    const mergedPending = this.mergeIntervals([...pending]);
    return this.isCoveredBy(mergedPending, fromMs, toMs);
  }

  private isCoveredBy(intervals: Interval[], fromMs: number, toMs: number): boolean {
    // intervals are assumed merged and sorted
    // If any interval fully contains [fromMs, toMs], it's covered
    let lo = 0,
      hi = intervals.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const it = intervals[mid];
      if (it.from <= fromMs && it.to >= toMs) return true;
      if (it.to < fromMs) lo = mid + 1;
      else hi = mid - 1;
    }
    return false;
  }

  private mergeIntervals(list: Interval[]): Interval[] {
    if (list.length <= 1) return list.sort((a, b) => a.from - b.from);

    list.sort((a, b) => a.from - b.from);
    const res: Interval[] = [];
    let cur = { ...list[0] };
    for (let i = 1; i < list.length; i++) {
      const nxt = list[i];
      if (nxt.from <= cur.to + 1) {
        cur.to = Math.max(cur.to, nxt.to);
      } else {
        res.push(cur);
        cur = { ...nxt };
      }
    }
    res.push(cur);
    return res;
  }

  private mergeIntoLoaded(index: number, fromMs: number, toMs: number): Interval[] {
    const list = [...this.intervalsFor(this.loadedByGroup, index), { from: fromMs, to: toMs }];
    return this.mergeIntervals(list);
  }

  private addPendingInterval(index: number, fromMs: number, toMs: number) {
    const list = [...this.intervalsFor(this.pendingByGroup, index), { from: fromMs, to: toMs }];
    this.setIntervals(this.pendingByGroup, index, list);
  }

  private removePendingInterval(index: number, fromMs: number, toMs: number) {
    const list = this.intervalsFor(this.pendingByGroup, index);
    if (!list.length) return;
    // Remove the exact interval match if present
    const idx = list.findIndex((i) => i.from === fromMs && i.to === toMs);
    if (idx >= 0) list.splice(idx, 1);
    this.setIntervals(this.pendingByGroup, index, list);
  }

  // --- Helpers: windowing ---------------------------------------------------

  private isInitialZeroState(): boolean {
    return this.scrollTop === 0 && this.clientHeight === 0 && this.scrollHeight === 0;
  }

  private dateISO(range: DateRange): { from: string; to: string } {
    return { from: range.start.toISOString(), to: range.end.toISOString() };
  }

  private rebuildPrefixHeights() {
    const n = this.groupHeights.length;
    this.prefixHeights = new Array(n + 1);
    this.prefixHeights[0] = 0;
    for (let i = 0; i < n; i++) {
      this.prefixHeights[i + 1] = this.prefixHeights[i] + this.groupHeights[i];
    }
  }

  // Returns [startIndex, endIndex] inclusive for groups intersecting the viewport
  private getVisibleIndices(): [number, number] {
    const n = this.groupHeights.length;
    if (n === 0) return [0, -1];

    const top = this.scrollTop;
    const bottom = Math.min(this.scrollTop + this.clientHeight, this.totalHeight());

    // Find first group whose bottom > top
    let start = this.upperBound(this.prefixHeights, top) - 1;
    if (start < 0) start = 0;

    // Find last group whose top < bottom
    let end = this.upperBound(this.prefixHeights, bottom) - 1;
    end = Math.min(end, n - 1);

    // Apply overscan
    start = Math.max(0, start - this.overscan);
    end = Math.min(n - 1, end + this.overscan);

    return [start, end];
  }

  private totalHeight(): number {
    return this.prefixHeights.length ? this.prefixHeights[this.prefixHeights.length - 1] : 0;
  }

  // upperBound: first index i where arr[i] > x
  private upperBound(arr: number[], x: number): number {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Find first contiguous block of visible groups that lack full coverage of [fromMs, toMs].
  private findContiguousMissingCoverage(fromMs: number, toMs: number, visStart: number, visEnd: number, maxCount: number): [number, number] | null {
    const n = this.groupHeights.length;
    if (n === 0 || visStart > visEnd) return null;

    let start = -1;
    for (let i = visStart; i <= visEnd; i++) {
      if (!this.isFullyCovered(i, fromMs, toMs)) {
        start = i;
        break;
      }
    }
    if (start === -1) return null;

    let count = 0;
    for (let i = start; i <= visEnd && count < maxCount; i++) {
      if (!this.isFullyCovered(i, fromMs, toMs)) {
        count++;
      } else {
        break; // keep contiguous
      }
    }

    return [start, Math.max(1, count)];
  }

  private markPending(fromMs: number, toMs: number, skip: number, count: number) {
    const start = Math.max(0, skip | 0);
    const end = start + Math.max(1, count | 0) - 1;
    for (let i = start; i <= end; i++) {
      this.addPendingInterval(i, fromMs, toMs);
    }
  }
}
