import { CancelToken } from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { DataSet, Timeline } from 'vis-timeline/standalone';

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
export type Params = {
  skip: number;
  limit: number;
  date: { from: string; to: string };
};

type TimeFrame = {
  start: Date;
  end: Date;
};

type WindowCache<I extends { start: Date }> = Map<number, Map<Dayjs, I>>;

export class HandleWindow<G, I extends { start: Date }> {
  getVisible: GetVisible<G, I>;
  timeline: Timeline;
  groupDataSet: DataSet<any, 'id'>;
  itemDataSet: DataSet<any, 'id'>;
  count: number = 0;
  hasMore = true;
  groupHeights: number[] = [];
  limit: number;
  onApiFail: (err: any) => void;
  scrollTop: number;
  clientHeight: number;
  prefixHeights: number[];
  overscan: number;
  windowCache: WindowCache<I> = new Map(new Map());
  constructor(
    { getVisible, groupDataSet, itemDataSet, timeline, limit = 15, onApiFail = (err) => console.error(err) }: HandleWindowProps<G, I>,
    overscan = 3
  ) {
    this.getVisible = getVisible;
    this.timeline = timeline;
    this.groupDataSet = groupDataSet;
    this.itemDataSet = itemDataSet;
    this.limit = limit;
    this.onApiFail = onApiFail;
    this.overscan = overscan;
  }

  setGroupHeights(heights: number[]) {
    this.groupHeights = heights.map((h) => Math.max(0, h | 0));
    this.rebuildPrefixHeights();
  }

  async initialize(timeFrame: TimeFrame) {
    const date = this.dateISO(timeFrame);
    const initialParams: Params = {
      date,
      limit: this.limit,
      skip: 0
    };

    try {
      const { count, groups, items } = await this.getVisible({ params: initialParams });
      if (groups.length > 0) this.groupDataSet.update(groups);
      if (items.length > 0) this.itemDataSet.update(items);
      this.itemDataSet.get();
      this.count = count;
      this.timeline?.redraw();
    } catch (error) {
      this.onApiFail(error);
    }
  }

  reset() {
    this.groupHeights = [];
    this.groupDataSet?.clear();
    this.itemDataSet?.clear();
  }

  getWindowItems() {}

  private rebuildPrefixHeights() {
    const n = this.groupHeights.length;
    this.prefixHeights = new Array(n + 1);
    this.prefixHeights[0] = 0;
    for (let i = 0; i < n; i++) {
      this.prefixHeights[i + 1] = this.prefixHeights[i] + this.groupHeights[i];
    }
  }

  private dateISO(range: TimeFrame): { from: string; to: string } {
    return { from: range.start.toISOString(), to: range.end.toISOString() };
  }

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

    start = Math.max(0, start - this.overscan);
    end = Math.min(n - 1, end + this.overscan);

    return [start, end];
  }

  private setCache(timeFrame: TimeFrame, items: I[]) {}
  private totalHeight(): number {
    return this.prefixHeights.length ? this.prefixHeights[this.prefixHeights.length - 1] : 0;
  }

  private getDateRange(timeFrame: TimeFrame): Dayjs[] {
    const startDate = dayjs(timeFrame.start).tz().startOf('day');
    const endDate = dayjs(timeFrame.end).tz().startOf('day');

    if (endDate.isBefore(startDate)) {
      throw new Error('End date must be the same as or after start date');
    }

    const dates: Dayjs[] = [];
    let current = startDate;

    while (current.isSameOrBefore(endDate, 'day')) {
      dates.push(current);
      current = current.add(1, 'day');
    }

    return dates;
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
}
