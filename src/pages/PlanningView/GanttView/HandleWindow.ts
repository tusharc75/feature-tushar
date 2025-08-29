import { CancelToken } from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { DataSet, Timeline } from 'vis-timeline/standalone';

export type Params = {
  skip: number;
  limit: number;
  date: { from: string; to: string };
};

type TimeFrame = { start: Date; end: Date };

type GetVisible<G, I extends { start: Date }> = (props: {
  params: Params;
  cancelToken?: CancelToken;
}) => Promise<{ groups: G[]; items: I[]; count: number }>;

type HandleWindowProps<G, I extends { start: Date }> = {
  groupDataSet: DataSet<any, 'id'>;
  itemDataSet: DataSet<any, 'id'>;
  getVisible: GetVisible<G, I>;
  timeline: Timeline;
  limit?: number;
  onApiFail?: (err: any) => void;
  overscan?: number;
};

/**
 * Cache structure: groupId -> dateString -> item[]
 * Supports fragmented data ranges.
 */
class WindowDataCache<I extends { start: Date }> {
  private cache: Map<number, Map<string, I[]>> = new Map();

  /** Store items for a given group+date */
  set(groupId: number, date: Dayjs, items: I[]): void {
    if (!this.cache.has(groupId)) {
      this.cache.set(groupId, new Map());
    }
    const dateKey = date.format('YYYY-MM-DD');
    this.cache.get(groupId)!.set(dateKey, items);
  }

  /** Retrieve items for given group+date, or undefined */
  get(groupId: number, date: Dayjs): I[] | undefined {
    return this.cache.get(groupId)?.get(date.format('YYYY-MM-DD'));
  }

  /** Check if we have all dates for a given range and group */
  hasFullRange(groupId: number, dates: Dayjs[]): boolean {
    const groupMap = this.cache.get(groupId);
    if (!groupMap) return false;
    return dates.every((d) => groupMap.has(d.format('YYYY-MM-DD')));
  }

  /** Get missing dates for a group from a given date range */
  getMissingDates(groupId: number, dates: Dayjs[]): Dayjs[] {
    const groupMap = this.cache.get(groupId);
    if (!groupMap) return dates;
    return dates.filter((d) => !groupMap.has(d.format('YYYY-MM-DD')));
  }
}

export class HandleWindow<G, I extends { start: Date }> {
  private getVisible: GetVisible<G, I>;
  private timeline: Timeline;
  private groupDataSet: DataSet<any, 'id'>;
  private itemDataSet: DataSet<any, 'id'>;
  private count = 0;
  private groupHeights: number[] = [];
  private limit: number;
  private onApiFail: (err: any) => void;
  private scrollTop = 0;
  private clientHeight = 0;
  private prefixHeights: number[] = [];
  private overscan: number;
  private cache: WindowDataCache<I>;

  constructor({
    getVisible,
    groupDataSet,
    itemDataSet,
    timeline,
    limit = 15,
    onApiFail = (err) => console.error(err),
    overscan = 3
  }: HandleWindowProps<G, I>) {
    this.getVisible = getVisible;
    this.timeline = timeline;
    this.groupDataSet = groupDataSet;
    this.itemDataSet = itemDataSet;
    this.limit = limit;
    this.onApiFail = onApiFail;
    this.overscan = overscan;
    this.cache = new WindowDataCache<I>();
  }

  setGroupHeights(heights: number[]) {
    this.groupHeights = heights.map((h) => Math.max(0, h | 0));
    this.rebuildPrefixHeights();
  }

  async initialize(timeFrame: TimeFrame) {
    await this.fetchAndCache(timeFrame);
  }

  reset() {
    this.groupHeights = [];
    this.groupDataSet.clear();
    this.itemDataSet.clear();
    this.cache = new WindowDataCache<I>();
  }

  /**
   * Called on scroll/zoom/window change.
   * If the full range is cached, returns immediately from cache;
   * else fetches missing segments only.
   */
  async getWindowItems() {
    const [startIdx, endIdx] = this.getVisibleIndices();
    if (startIdx > endIdx) return;

    const range: TimeFrame = this.timeline.getWindow();

    const datesInRange = this.getDateRange(range);

    for (let groupId = startIdx; groupId <= endIdx; groupId++) {
      const missingDates = this.cache.getMissingDates(groupId, datesInRange);
      if (missingDates.length === 0) {
        // Already cached — inject into DataSet
        datesInRange.forEach((d) => {
          const items = this.cache.get(groupId, d);
          if (items) this.itemDataSet.update(items);
        });
        continue;
      }

      // Fetch only missing range dates
      const fetchRange: TimeFrame = {
        start: missingDates[0].toDate(),
        end: missingDates[missingDates.length - 1].toDate()
      };
      await this.fetchAndCache(fetchRange);
    }

    this.timeline.redraw();
  }

  /** Internal: fetch visible data & push to cache + datasets */
  private async fetchAndCache(timeFrame: TimeFrame) {
    const date = this.dateISO(timeFrame);
    const params: Params = { date, limit: this.limit, skip: 0 };

    try {
      const { count, groups, items } = await this.getVisible({ params });

      if (groups.length) this.groupDataSet.update(groups);
      if (items.length) this.itemDataSet.update(items);

      // Cache items per group per day
      items.forEach((item) => {
        const groupId = (item as any).group;
        const itemDate = dayjs(item.start).startOf('day');
        this.cache.set(groupId, itemDate, [item]);
      });

      this.count = count;
    } catch (err) {
      this.onApiFail(err);
    }
  }

  private rebuildPrefixHeights() {
    const n = this.groupHeights.length;
    this.prefixHeights = new Array(n + 1);
    this.prefixHeights[0] = 0;
    for (let i = 0; i < n; i++) {
      this.prefixHeights[i + 1] = this.prefixHeights[i] + this.groupHeights[i];
    }
  }

  private dateISO(range: TimeFrame) {
    return { from: range.start.toISOString(), to: range.end.toISOString() };
  }

  private getVisibleIndices(): [number, number] {
    const n = this.groupHeights.length;
    if (n === 0) return [0, -1];
    const top = this.scrollTop;
    const bottom = Math.min(this.scrollTop + this.clientHeight, this.totalHeight());
    let start = this.upperBound(this.prefixHeights, top) - 1;
    if (start < 0) start = 0;
    let end = this.upperBound(this.prefixHeights, bottom) - 1;
    end = Math.min(end, n - 1);
    start = Math.max(0, start - this.overscan);
    end = Math.min(n - 1, end + this.overscan);
    return [start, end];
  }

  private totalHeight(): number {
    return this.prefixHeights.length ? this.prefixHeights[this.prefixHeights.length - 1] : 0;
  }

  private getDateRange(timeFrame: TimeFrame): Dayjs[] {
    const startDate = dayjs(timeFrame.start).startOf('day');
    const endDate = dayjs(timeFrame.end).startOf('day');
    if (endDate.isBefore(startDate)) {
      throw new Error('End date must be after or equal to start date');
    }
    const dates: Dayjs[] = [];
    let current = startDate;
    while (current.isSameOrBefore(endDate, 'day')) {
      dates.push(current);
      current = current.add(1, 'day');
    }
    return dates;
  }

  private upperBound(arr: number[], x: number): number {
    let lo = 0,
      hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
