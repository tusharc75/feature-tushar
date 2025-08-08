import dayjs from 'dayjs';
import { isEmpty } from 'lodash';
import { DateRange, DeepFilter, FilterByID, FilterTerm, Option } from 'src/components/KanbanView/types';

export const prepareDeepFilters = (deepFiltersOriginal: DeepFilter[], filterTerm: FilterTerm) => {
  if (deepFiltersOriginal.length === 0) return [];
  const deepFilter = deepFiltersOriginal
    ?.filter((d) => {
      if (d?.type === 'date') {
        const term = d.term as DateRange;
        if (d?.duration === 'custom')
          return (dayjs(term?.from).isValid() && term?.from instanceof Date) || (dayjs(term?.to).isValid() && term?.to instanceof Date);
        else return dayjs(term?.from).isValid() && term?.from instanceof Date && dayjs(term?.from).isValid() && term?.from instanceof Date;
      }
      return (d?.term as any)?.length ? true : false;
    })
    ?.map((d) => {
      if (d?.type === 'date') {
        const term = d.term as DateRange;
        return {
          field: d?.field,
          term: {
            ...(term?.from ? { from: term?.from } : {}),
            ...(term?.to ? { to: term?.to } : {})
          }
        };
      }
      if (filterTerm[d?.field] === '$nin' && Array.isArray(d?.term)) {
        return {
          field: d?.field,
          term: { $nin: d?.term }
        };
      }
      return {
        field: d?.field,
        term: d?.term
      };
    });

  return deepFilter;
};

export const prepareFilterByIds = (filterByIdsOriginal: FilterByID[], filterTerm: FilterTerm) => {
  const filterByIds = filterByIdsOriginal
    ?.filter((f) => {
      if (typeof f?.term === 'object') return !isEmpty(f?.term);
      return Array.isArray(f?.term) && (f?.term as any)?.length > 0;
    })
    ?.map((f) => {
      const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
      if (Array.isArray(f?.term)) {
        return {
          field: f?.field,
          term: {
            [term]: f?.term?.map?.((d: any) => d.optionValue)
          }
        };
      }
      if (term === '$nin') {
        return {
          field: f?.field,
          term: {
            $nin: [(f?.term as any)?.optionValue]
          }
        };
      }
      return {
        field: f?.field,
        term: (f?.term as any)?.optionValue
      };
    });

  return filterByIds;
};

export function getSortedVisibleColumns<D>(order: string[], visible: Record<string, boolean>, columns: D[], nameAccessor: (col: D) => string): D[] {
  const visibleColumns = columns.filter((col) => visible[nameAccessor(col)]);
  const columnMap = new Map(visibleColumns.map((col) => [nameAccessor(col), col]));
  const sorted = order.map((name) => columnMap.get(name)).filter((col): col is D => !!col);
  const remaining = visibleColumns.filter((col) => !order.includes(nameAccessor(col)));
  return [...sorted, ...remaining];
}

export function createCleanLoadingState(options: Option[]) {
  return options.reduce(
    (acc, curr) => {
      acc[curr.optionValue] = false;
      return acc;
    },
    {} as Record<string, boolean>
  );
}
