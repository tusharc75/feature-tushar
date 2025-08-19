import dayjs from 'dayjs';
import { camelCase } from 'lodash';
import { calculateRatio } from 'src/constants/helpers';
import { PlanningResource } from 'src/pages/PlanningView/usePlanningResource';
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
  isLoading?: boolean;
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

const today = dayjs.tz();

export const buildFromRows = ({
  rows,
  selectedResource,
  resourcePolicy
}: {
  rows: RawGroup[];
  selectedResource: PlanningResource;
  resourcePolicy: any;
}) => {
  const groups = rows.map((g) => ({
    productName: g.productName,
    _id: g._id,
    id: g._id,
    productDescription: g.productDescription,
    isLoading: false
  }));

  const items = rows.flatMap((rawGroup) => {
    const groupId = rawGroup._id;
    return rawGroup.data.flatMap((d: RawDay, i: number) => {
      const baseId = d._id ?? `item-${i}_${groupId}`;

      // local date boundaries for the band
      const localDate = dayjs(d.date).tz();
      const start = localDate.startOf('day').toDate();
      const end = localDate.endOf('day').toDate();

      // ledger comparisons against "today"
      const ledgerDate = dayjs(d.date);
      const isPast = ledgerDate.isBefore(today, 'day');
      const isFuture = ledgerDate.isAfter(today, 'day');

      const base = {
        group: groupId,
        groupName: rawGroup.productName,
        originalDate: d.date,
        start,
        end,
        allDay: true,
        resource: selectedResource?.resource
      };

      const one = buildOneItem({ baseId, d, base, isPast, isFuture, resourcePolicy });
      return one ? [one] : [];
    });
  });

  return { groups, items };
};

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
