import dayjs from 'dayjs';
import { camelCase } from 'lodash';
import { calculateRatio } from 'src/constants/helpers';
import { Timeline } from 'vis-timeline';

export type RawDay = {
  _id?: string;
  date: string;
  debit?: Array<{ qty: number | string }>;
  credit?: Array<{ qty: number | string }>;
  availableByPlanning?: number;
  inUseByPlanning?: number;
  inventory?: number;
  assetCount?: number;
  [key: string]: any;
};

export type TimeRange = { start: Date; end: Date };

export type RawGroup = {
  _id: string;
  productName: string;
  data: RawDay[];
  productDescription?: string;
};

const KNOWN_KEYS = new Set(['_id', 'id', 'date', 'debit', 'credit', 'availableByPlanning', 'inUseByPlanning', 'inventory', 'assetCount', 'softhold']);
const toNumber = (v: unknown) => Number(v || 0);
const sumQty = (rows?: Array<{ qty: number | string }>) => (rows || []).reduce((sum, r) => sum + toNumber(r?.qty), 0);

export const buildOneItem = ({
  baseId,
  d,
  base,
  isPast,
  isFuture,
  resourcePolicy
}: {
  baseId: string;
  d: RawDay;
  base: any;
  isPast: boolean;
  isFuture: boolean;
  resourcePolicy: any;
}) => {
  const hideBackDated = !!resourcePolicy?.hideBackDatedPlanning && isPast;

  // Precedence: debit > credit > available > inUse > inventory > assetCount > dynamic status
  // debit
  if (!hideBackDated && Array.isArray(d.debit) && d.debit.length) {
    const qty = sumQty(d.debit);
    return {
      ...base,
      id: baseId,
      _id: baseId,
      title: `↓ Planned ${qty}`,
      suffixComponent: <span id="planning-planned" />,
      dataType: 'debit',
      data: d.debit,
      order: 1
    };
  }

  // credit
  if (!hideBackDated && Array.isArray(d.credit) && d.credit.length) {
    const qty = sumQty(d.credit);
    return {
      ...base,
      id: baseId,
      _id: baseId,
      title: `↑ Incoming ${qty}`,
      suffixComponent: <span id="planning-incoming" />,
      dataType: 'credit',
      data: d.credit,
      order: 2
    };
  }

  // availableByPlanning
  if (!hideBackDated && d.availableByPlanning !== undefined) {
    return {
      ...base,
      id: baseId,
      _id: baseId,
      title: `Available (Planned) ${d.availableByPlanning || 0}`,
      dataType: 'availableByPlanning',
      isRedAlert: (d.availableByPlanning ?? 0) < 0,
      order: 3
    };
  }

  // inUseByPlanning (only today/future if allowed)
  if (!isPast && resourcePolicy?.showInUsePlanned && d.inUseByPlanning !== undefined) {
    return {
      ...base,
      id: baseId,
      _id: baseId,
      title: `In-Use (Planned) ${d.inUseByPlanning || 0}`,
      dataType: 'inUseByPlanning',
      order: 4
    };
  }

  // inventory
  if (d.inventory !== undefined && d.inventory !== null) {
    return {
      ...base,
      id: baseId,
      _id: baseId,
      title: `Inventory ${d.inventory}`,
      order: 5
    };
  }

  // assetCount (guard future hide)
  if (d.assetCount && !(resourcePolicy?.hideAssetStatusForFutureDates && isFuture)) {
    return {
      ...base,
      id: baseId,
      _id: baseId,
      title: `Total Assets ${d.assetCount}`,
      dataType: 'assetStatusTotal',
      status: null,
      order: 7
    };
  }

  // first dynamic asset status
  if (!(resourcePolicy?.hideAssetStatusForFutureDates && isFuture)) {
    for (const key in d) {
      if (KNOWN_KEYS.has(key)) continue;
      const value = d[key];
      if (!value) continue;
      return {
        ...base,
        id: baseId,
        _id: baseId,
        title: `${key} ${value}`,
        dataType: 'assetStatus',
        status: key,
        order: 6
      };
    }
  }

  // nothing to show for this day
  return undefined;
};

const FIT_WIDTH = 1785;
const FIT_DAYS = 9.6;

export const handleTimelineCLick = (event: MouseEvent, timeline: Timeline, container: HTMLDivElement) => {
  if (!timeline || !container) return;
  const target = event.currentTarget as HTMLDivElement;
  const zoom = target.classList.contains('vis-minor') ? 1 : -1;
  const data = timeline.getEventProperties(event);

  const time = data.time;
  let start = dayjs(time).startOf('day').toDate();
  let end = dayjs(time).endOf('day').toDate();
  if (zoom < 0) {
    start = dayjs(time).startOf('month').toDate();
    end = dayjs(time).endOf('month').toDate();

    const containerCurrentWidth = container?.clientWidth;
    if (containerCurrentWidth) {
      const halfOfTotalDays = Math.floor(calculateRatio(FIT_WIDTH, FIT_DAYS, containerCurrentWidth) / 2);

      start = dayjs(time).subtract(halfOfTotalDays, 'days').toDate();
      end = dayjs(time).add(halfOfTotalDays, 'days').toDate();
    }
  }
  timeline.setWindow(start, end);
};

export const getWindow = (container) => {
  const containerCurrentWidth = container?.clientWidth;
  if (containerCurrentWidth) {
    const halfOfTotalDays = Math.floor(calculateRatio(FIT_WIDTH, FIT_DAYS, containerCurrentWidth) / 2);
    return {
      start: dayjs().subtract(halfOfTotalDays, 'days').toDate(),
      end: dayjs().add(halfOfTotalDays, 'days').toDate()
    };
  }
  return {
    start: dayjs().subtract(10, 'day').toDate(),
    end: dayjs().add(10, 'day').toDate()
  };
};

// Utilities: normalize, merge, subtract coverage
export const startOfDay = (d: Date) => dayjs(d).startOf('day').toDate();
export const endOfDay = (d: Date) => dayjs(d).endOf('day').toDate();

export const normalizeRange = (r: TimeRange): TimeRange => ({
  start: startOfDay(r.start),
  end: endOfDay(r.end)
});

// Merge ranges; assumes r.start <= r.end
export const mergeCoverage = (covered: TimeRange[], add: TimeRange): TimeRange[] => {
  const next = [...covered, add].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeRange[] = [];
  for (const r of next) {
    if (!merged.length) {
      merged.push({ ...r });
      continue;
    }
    const last = merged[merged.length - 1];
    if (r.start.getTime() <= last.end.getTime() + 1) {
      // overlap or adjacent
      last.end = new Date(Math.max(last.end.getTime(), r.end.getTime()));
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
};

// Subtract covered from target, returning missing disjoint ranges
export const subtractCoverage = (covered: TimeRange[], target: TimeRange): TimeRange[] => {
  if (!covered.length) return [target];

  const result: TimeRange[] = [];
  let cursor = target.start.getTime();
  const targetEnd = target.end.getTime();

  for (const c of covered) {
    const cs = Math.max(c.start.getTime(), target.start.getTime());
    const ce = Math.min(c.end.getTime(), target.end.getTime());
    if (ce < cs) continue; // no overlap with target

    if (cursor < cs) {
      result.push({ start: new Date(cursor), end: new Date(cs - 1) });
    }
    cursor = Math.max(cursor, ce + 1);
    if (cursor > targetEnd) break;
  }

  if (cursor <= targetEnd) {
    result.push({ start: new Date(cursor), end: new Date(targetEnd) });
  }
  return result;
};

export const fmt = (d: Date) => dayjs(d).format('MM/DD/YYYY');

export const mapObjectToList = (obj: { [key: string]: any[] }, resources) => {
  const data: { items: any[]; key: string; heading: string }[] = [];
  for (const key in obj) {
    data.push({
      items: obj[key],
      key: key,
      heading: resources?.[camelCase(key)]?.titlePlural || key
    });
  }
  return data;
};
