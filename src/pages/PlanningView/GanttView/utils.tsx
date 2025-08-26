import dayjs from 'dayjs';
import { camelCase } from 'lodash';
import { calculateRatio } from 'src/constants/helpers';
import { PlanningResource } from 'src/pages/PlanningView/usePlanningResource';
import { Timeline } from 'vis-timeline';

export type TimeRange = { start: Date; end: Date };

export type RawGroup = {
  _id: string;
  productName: string;
  data: RawDay[];
  productDescription?: string;
  isLoading?: boolean;
};

export type RawDayItems = {
  id: string;
  _id?: string;
  date: string;
  debit?: Array<{ qty: number | string }>;
  credit?: Array<{ qty: number | string }>;
  availableByPlanning?: number;
  inUseByPlanning?: number;
  inventory?: number;
  assetCount?: number;
  dataType?: string;
  [key: string]: any;
};

export type RawDay = {
  id: string;
  _id?: string;
  group?;
  string;
  start: Date;
  end: Date;
  originalDate: Date;
  allDay: boolean;
  resource: string;
  items: RawDayItems[];
  allData: RawDayItems[];
  moreDataLength?: number;
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
  d: any;
  base: any;
  isPast: boolean;
  isFuture: boolean;
  resourcePolicy: any;
}) => {
  const hideBackDated = !!resourcePolicy?.hideBackDatedPlanning && isPast;
  const items = [];

  // Precedence: debit > credit > available > inUse > inventory > assetCount > dynamic status
  // debit
  if (!hideBackDated && Array.isArray(d.debit) && d.debit.length) {
    const qty = sumQty(d.debit);
    items.push({
      ...base,
      id: `${baseId}↓-Planned-${qty}`,
      _id: baseId,
      title: `↓ Planned ${qty}`,
      suffixComponent: <span id="planning-planned" />,
      dataType: 'debit',
      data: d.debit,
      order: 1
    });
  }

  // credit
  if (!hideBackDated && Array.isArray(d.credit) && d.credit.length) {
    const qty = sumQty(d.credit);
    items.push({
      ...base,
      id: `${baseId}↑-Incoming-${qty}`,
      _id: baseId,
      title: `↑ Incoming ${qty}`,
      suffixComponent: <span id="planning-incoming" />,
      dataType: 'credit',
      data: d.credit,
      order: 2
    });
  }

  // availableByPlanning
  if (!hideBackDated && d.availableByPlanning) {
    items.push({
      ...base,
      id: `${baseId}Available-(Planned)-${d.availableByPlanning || 0}`,
      _id: baseId,
      title: `Available (Planned) ${d.availableByPlanning || 0}`,
      dataType: 'availableByPlanning',
      isRedAlert: (d.availableByPlanning ?? 0) < 0,
      order: 3
    });
  }

  // inUseByPlanning (only today/future if allowed)
  if (!isPast && resourcePolicy?.showInUsePlanned && d.inUseByPlanning) {
    items.push({
      ...base,
      id: `${baseId}In-Use-(Planned)-${d.inUseByPlanning || 0}`,
      _id: baseId,
      title: `In-Use (Planned) ${d.inUseByPlanning || 0}`,
      dataType: 'inUseByPlanning',
      order: 4
    });
  }

  // inventory
  if (d.inventory !== undefined && d.inventory) {
    items.push({
      ...base,
      id: `${baseId}Inventory-${d.inventory}`,
      _id: baseId,
      title: `Inventory ${d.inventory}`,
      order: 5
    });
  }

  // assetCount (guard future hide)
  if (d.assetCount && !(resourcePolicy?.hideAssetStatusForFutureDates && isFuture)) {
    items.push({
      ...base,
      id: `${baseId}Total-Assets-${d.assetCount}`,
      _id: baseId,
      title: `Total Assets ${d.assetCount}`,
      dataType: 'assetStatusTotal',
      status: null,
      order: 7
    });
  }

  // first dynamic asset status
  if (!(resourcePolicy?.hideAssetStatusForFutureDates && isFuture)) {
    for (const key in d) {
      if (KNOWN_KEYS.has(key)) continue;
      const value = d[key];
      if (!value) continue;
      items.push({
        ...base,
        id: `${baseId}-${key}-${value}`,
        _id: baseId,
        title: `${key} ${value}`,
        dataType: 'assetStatus',
        status: key,
        order: 6
      });
    }
  }

  return items;
};

const today = dayjs.tz();

const LIMIT_TO_SHOW_MORE = 3;

function splitArrayAtIndex<D>(arr: D[], index: number) {
  if (!Array.isArray(arr)) throw new TypeError('First argument must be an array');
  if (typeof index !== 'number' || index < 0 || index > arr.length) throw new RangeError('Index must be a valid number within array bounds');

  const beforePivot = arr.slice(0, index);
  const fromPivot = arr.slice(index);
  return [beforePivot, fromPivot];
}

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
    return rawGroup.data.flatMap((d: any, i: number) => {
      const baseId = d._id ?? `item-${i}_${groupId}`;

      // local date boundaries for the band
      const localDate = dayjs(d.date).tz();
      const start = localDate.startOf('day').toDate();
      const end = localDate.endOf('day').toDate();

      // ledger comparisons against "today"
      const ledgerDate = dayjs(d.date).tz();
      const isPast = ledgerDate.isBefore(today, 'day');
      const isFuture = ledgerDate.isAfter(today, 'day');

      const base = {
        id: baseId,
        _id: baseId,
        group: groupId,
        groupName: rawGroup.productName,
        originalDate: d.date,
        start,
        end,
        allDay: true,
        resource: selectedResource?.resource
      };

      const data = buildOneItem({ baseId, d, base, isPast, isFuture, resourcePolicy });
      if (data.length > LIMIT_TO_SHOW_MORE) {
        const [start, end] = splitArrayAtIndex(data, LIMIT_TO_SHOW_MORE);
        return { ...base, items: start, allData: [...start, ...end], moreDataLength: end.length };
      } else {
        return { ...base, items: data };
      }
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

export const handleAddRemoveCollapseButton = () => {
  const MAX_HEIGHT = 77;
  const groups = document.querySelectorAll('.vis-foreground .vis-group');
  const panels = document.querySelectorAll('.vis-panel.vis-left .vis-label');
  for (let i = 0; i < groups.length; i++) {
    const item = groups[i] as HTMLDivElement;
    const panel = panels[i] as HTMLDivElement;
    const setMaxHeight = (height: number) => {
      item.style.maxHeight = `${height}px`;
      panel.style.maxHeight = `${height}px`;
    };
    const setMinHeight = (height: number | '') => {
      item.style.minHeight = !height ? '' : `${height}px`;
      panel.style.minHeight = !height ? '' : `${height}px`;
    };

    item.setAttribute('data-original-height', `${parseInt((item.computedStyleMap().get('height') as string) || '0px', 10)}`);
    if (+item.dataset.originalHeight > MAX_HEIGHT - 27 && !item.dataset.expanded) {
      setMaxHeight(MAX_HEIGHT);

      item.style.overflow = 'hidden';
      if (!item.dataset.buttonInserted) {
        const collapseButton = document.createElement('button');
        collapseButton.innerText = 'Collapse';
        collapseButton.classList.add('timeline-collapse-button');
        collapseButton.onclick = (e) => {
          item.removeAttribute('data-expanded');
          item.appendChild(button);
          setMaxHeight(MAX_HEIGHT);
          setMinHeight('');
          try {
            item.removeChild(collapseButton);
          } catch {}
        };

        const button = document.createElement('button');
        button.innerText = 'Show All';
        button.onclick = (e) => {
          setMaxHeight(Number(item.dataset.originalHeight) + 40);
          setTimeout(() => {
            setMinHeight(Number(item.dataset.originalHeight) + 40);
          }, 300);
          item.setAttribute('data-expanded', 'true');
          panel.setAttribute('data-expanded', 'true');
          item.appendChild(collapseButton);

          try {
            item.removeChild(button);
          } catch (error) {}
        };
        button.classList.add('timeline-show-all-button');
        item.appendChild(button);
        item.setAttribute('data-button-inserted', 'true');
      }
    }
  }
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
