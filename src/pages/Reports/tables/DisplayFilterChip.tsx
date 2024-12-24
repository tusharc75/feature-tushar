import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { camelCase, isEmpty, uniqBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';
import { ResourceColumn } from 'src/pages/Reports/types';

type Dates = {
  field: string;
  term: string;
};
type FilterStringArray = {
  field: string;
  term: string[];
};
type FilterObject = {
  field: string;
  term: Object;
};
type FilterObjectArray = {
  field: string;
  term: Object[];
};
type Filter = {
  field: string;
  term: string | string[] | Object[];
};
type Object = {
  optionValue: string;
  optionLabel: string;
  order: number;
  default: boolean;
};

type FilterTerm = { [key: string]: '$in' | '$nin' };
type DisplayFilterChipProps = {
  deepFilters: Filter[];
  filterByIds: Filter[];
  resourceColumns: ResourceColumn[];
  setDeepFilters: React.Dispatch<React.SetStateAction<any[]>>;
  setFilterByIds: React.Dispatch<React.SetStateAction<any[]>>;
  fetchResourceData: (deepFilters?: Filter[], filterByIds?: Filter[]) => void;
  filterTerm: FilterTerm;
};

const textClassName = 'text-[12px] font-medium leading-[14px] text-[--primary] line-clamp-1';
const buttonStyle: React.CSSProperties = {
  borderRadius: 50,
  position: 'absolute',
  right: 5,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 16,
  color: 'var(--primary)'
};
const chipClassName =
  'relative max-w-[200px] rounded-[6px] bg-[--new-theme-secondary-color] p-[5px_7px] pr-[26px] [border:1px_solid_var(--new-theme-secondary-border-color)]';

const SPLIT_SIGN = ' =|= ';

const DisplayFilterChip = ({
  deepFilters,
  filterByIds,
  resourceColumns = [],
  filterTerm = {},
  fetchResourceData,
  setDeepFilters,
  setFilterByIds
}: DisplayFilterChipProps) => {
  const uniqueFilters = useMemo(() => uniqBy([...deepFilters, ...filterByIds], (d) => d.field), [deepFilters, filterByIds]);
  const [filters, setFilters] = useState<{ dates: Dates[]; otherData: Filter[] }>({ dates: [], otherData: [] });
  const { colNameMap, colTypeMap } = useMemo(() => {
    const colNameMap: { [key: string]: string } = {};
    const colTypeMap: { [key: string]: string } = {};
    for (const col of resourceColumns) {
      colNameMap[col.fieldData.fieldName] = col.fieldData.fieldLabel;
      colTypeMap[col.fieldData.fieldName] = col.fieldData.type;
    }
    return { colNameMap, colTypeMap };
  }, [resourceColumns]);

  const createFiltersData = useCallback(() => {
    const otherData = [],
      dateObj = {};
    uniqueFilters?.forEach((d) => {
      if (d.field.startsWith('from_') || d.field.startsWith('to_')) {
        const title = d.field.replace('from_', '').replace('to_', '');
        dateObj[title] = dateObj[title] ? `${dateObj[title]} - ${d.term}` : d.term;
      } else {
        otherData.push(d);
      }
    });
    setFilters({ dates: Object.keys(dateObj).map((key) => ({ field: key, term: dateObj[key] as string })), otherData });
  }, [uniqueFilters]);

  useEffect(() => {
    createFiltersData();
  }, [createFiltersData]);

  const handleClearFilter = useCallback(
    (keys: string[]) => {
      const newDeepFilters = deepFilters.filter((d) => !keys.includes(d.field));
      const newFilterByIds = filterByIds.filter((d) => !keys.includes(d.field));
      if (setDeepFilters) setDeepFilters(newDeepFilters);
      if (setFilterByIds) setFilterByIds(newFilterByIds);
      setTimeout(() => {
        fetchResourceData(newDeepFilters, newFilterByIds);
      }, 500);
    },
    [fetchResourceData, setDeepFilters, setFilterByIds, deepFilters, filterByIds]
  );

  return (
    <div className="flex flex-wrap gap-2 md:max-w-[calc(100%-100px)]">
      {filters.otherData?.map((d) => {
        const sign = ['checkBox'].includes(colTypeMap[d.field]) ? ':' : filterTerm[d.field] === '$nin' ? '≠' : '=';
        if (typeof d.term === 'string') {
          return <RenderSringType sign={sign} colNameMap={colNameMap} key={d.field} data={d as Dates} handleClearFilter={handleClearFilter} />;
        }
        if (Array.isArray(d.term) && typeof d.term[0] === 'string') {
          return (
            <RenderStringArray
              sign={sign}
              colNameMap={colNameMap}
              key={d.field}
              data={d as FilterStringArray}
              handleClearFilter={handleClearFilter}
            />
          );
        }
        if (!Array.isArray(d.term) && typeof d?.term === 'object') {
          return (
            <RenderObject
              sign={sign}
              colNameMap={colNameMap}
              key={d.field}
              data={d as unknown as FilterObject}
              handleClearFilter={handleClearFilter}
            />
          );
        }
        return (
          <RenderObjectArray sign={sign} colNameMap={colNameMap} key={d.field} data={d as FilterObjectArray} handleClearFilter={handleClearFilter} />
        );
      })}
      {filters.dates?.map((d) => {
        return <RenderDates sign={':'} colNameMap={colNameMap} key={d.field} data={d} handleClearFilter={handleClearFilter} />;
      })}
    </div>
  );
};

export default DisplayFilterChip;

type ChipProps<D> = { data: D; handleClearFilter: (keys: string[]) => void; colNameMap: { [key: string]: string }; sign: React.ReactNode };

const RenderSringType = <D extends Dates>({ data, handleClearFilter, colNameMap, sign }: ChipProps<D>) => {
  if (!data?.term) return null;
  return (
    <Tooltip sign={sign as any} label={colNameMap[data.field]} value={data.term}>
      <div className={cn(chipClassName)}>
        <span className={cn(textClassName)}>
          {colNameMap[data.field]}&nbsp;{sign}&nbsp;{data.term}
        </span>
        <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
          <Close fontSize="inherit" />
        </IconButton>
      </div>
    </Tooltip>
  );
};
const RenderDates = <D extends Dates>({ data, handleClearFilter, colNameMap, sign }: ChipProps<D>) => {
  if (!data?.term) return null;

  return (
    <Tooltip sign={sign as any} label={colNameMap[data.field]} value={data.term}>
      <div className={cn(chipClassName)}>
        <span className={cn(textClassName)}>
          {colNameMap[data.field]}&nbsp;{sign}&nbsp;
          {data.term}
        </span>
        <IconButton
          size="small"
          style={buttonStyle}
          onClick={() => handleClearFilter([`from_${camelCase(data.field)}`, `to_${camelCase(data.field)}`])}
        >
          <Close fontSize="inherit" />
        </IconButton>
      </div>
    </Tooltip>
  );
};
const RenderStringArray = <D extends FilterStringArray>({ data, handleClearFilter, colNameMap, sign }: ChipProps<D>) => {
  if (data?.term?.length === 0) return null;
  return (
    <Tooltip sign={sign as any} label={colNameMap[data.field]} value={data.term.join(SPLIT_SIGN)}>
      <div className={cn(chipClassName)}>
        <span className={cn(textClassName)}>
          {colNameMap[data.field]}&nbsp;{sign}&nbsp;
          {data.term.join(', ')}
        </span>
        <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
          <Close fontSize="inherit" />
        </IconButton>
      </div>
    </Tooltip>
  );
};
const RenderObject = <D extends FilterObject>({ data, handleClearFilter, colNameMap, sign }: ChipProps<D>) => {
  if (isEmpty(data?.term)) return null;
  return (
    <Tooltip sign={sign as any} label={colNameMap[data.field]} value={data.term?.optionLabel || ''}>
      <div className={cn(chipClassName)}>
        <span className={cn(textClassName)}>
          {colNameMap[data.field]}&nbsp;{sign}&nbsp;
          {data.term?.optionLabel || ''}
        </span>
        <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
          <Close fontSize="inherit" />
        </IconButton>
      </div>
    </Tooltip>
  );
};
const RenderObjectArray = <D extends FilterObjectArray>({ data, handleClearFilter, colNameMap, sign }: ChipProps<D>) => {
  if (data?.term?.length === 0) return null;
  return (
    <Tooltip sign={sign as any} label={colNameMap[data.field]} value={data.term?.map?.((d) => d?.optionLabel).join(SPLIT_SIGN) || ''}>
      <div className={cn(chipClassName)}>
        <span className={cn(textClassName)}>
          {colNameMap[data.field]}&nbsp;{sign}&nbsp;
          {data.term?.map?.((d) => d?.optionLabel).join(', ') || ''}
        </span>
        <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
          <Close fontSize="inherit" />
        </IconButton>
      </div>
    </Tooltip>
  );
};

const Tooltip = ({
  value,
  sign,
  label,
  children
}: {
  value: string;
  sign: '=' | '≠' | '';
  label: string;
  children: React.ReactElement<any, any>;
}) => {
  const valueArr = useMemo(() => value.split(SPLIT_SIGN), [value]);
  return (
    <HtmlTooltip
      title={
        <div className={cn('flex w-[200px] flex-col p-2 text-center')}>
          {sign && ['=', '≠'].includes(sign) && (
            <span className="mx-auto mb-2 block max-w-fit rounded-md bg-gray-700 px-3 py-1 text-xs">{sign === '=' ? 'Include' : 'Exclude'}</span>
          )}
          {label && <h6 className="mb-1 border-b pb-1 text-sm font-semibold ">{label}</h6>}
          <ul className={cn('flex-grow space-y-1 overflow-y-auto  text-xs', valueArr.length > 1 ? 'mt-1 list-disc pl-4 text-left' : 'list-none')}>
            {valueArr.map((d) => (
              <li>{d}</li>
            ))}
          </ul>
        </div>
      }
    >
      {children}
    </HtmlTooltip>
  );
};