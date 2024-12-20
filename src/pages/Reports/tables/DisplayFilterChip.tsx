import { IconButton } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { camelCase, startCase, uniqBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from 'src/constants/helpers';

type Dates = {
  field: string;
  term: string;
};
type FilterStringArray = {
  field: string;
  term: string[];
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
type DisplayFilterChipProps = {
  deepFilters: Filter[];
  filterByIds: Filter[];
  setDeepFilters: React.Dispatch<React.SetStateAction<any[]>>;
  setFilterByIds: React.Dispatch<React.SetStateAction<any[]>>;
  fetchResourceData: (deepFilters?: Filter[], filterByIds?: Filter[]) => void;
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

const DisplayFilterChip = ({ deepFilters, filterByIds, fetchResourceData, setDeepFilters, setFilterByIds }: DisplayFilterChipProps) => {
  const uniqueFilters = useMemo(() => uniqBy([...deepFilters, ...filterByIds], (d) => d.field), [deepFilters, filterByIds]);
  const [filters, setFilters] = useState<{ dates: Dates[]; otherData: Filter[] }>({ dates: [], otherData: [] });

  const createFiltersData = useCallback(() => {
    const otherData = [],
      dateObj = {};
    uniqueFilters?.forEach((d) => {
      if (d.field.startsWith('from_') || d.field.startsWith('to_')) {
        const title = startCase(d.field.replace('from_', '').replace('to_', ''));
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
      setDeepFilters(newDeepFilters);
      setFilterByIds(newFilterByIds);
      setTimeout(() => {
        fetchResourceData(newDeepFilters, newFilterByIds);
      }, 500);
    },
    [fetchResourceData, setDeepFilters, setFilterByIds, deepFilters, filterByIds]
  );

  return (
    <div className="flex flex-wrap gap-2 md:max-w-[calc(100%-100px)]">
      {filters.otherData?.map((d) => {
        if (typeof d.term === 'string') {
          return <RenderSringType key={d.field} data={d as Dates} handleClearFilter={handleClearFilter} />;
        }
        if (Array.isArray(d.term) && typeof d.term[0] === 'string') {
          return <RenderStringArray key={d.field} data={d as FilterStringArray} handleClearFilter={handleClearFilter} />;
        }
        return <RenderObjectArray key={d.field} data={d as FilterObjectArray} handleClearFilter={handleClearFilter} />;
      })}
      {filters.dates?.map((d) => {
        return <RenderDates key={d.field} data={d} handleClearFilter={handleClearFilter} />;
      })}
    </div>
  );
};

export default DisplayFilterChip;

const RenderSringType = ({ data, handleClearFilter }: { data: Dates; handleClearFilter: (keys: string[]) => void }) => {
  const title = startCase(data.field);
  if (!data?.term) return null;
  return (
    <div className={cn(chipClassName)} title={data.term}>
      <span className={cn(textClassName)}>
        {title}: {data.term}
      </span>
      <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
        <Close fontSize="inherit" />
      </IconButton>
    </div>
  );
};
const RenderDates = ({ data, handleClearFilter }: { data: Dates; handleClearFilter: (keys: string[]) => void }) => {
  if (!data?.term) return null;
  return (
    <div className={cn(chipClassName)} title={data.term}>
      <span className={cn(textClassName)}>
        {data.field}: {data.term}
      </span>
      <IconButton
        size="small"
        style={buttonStyle}
        onClick={() => handleClearFilter([`from_${camelCase(data.field)}`, `to_${camelCase(data.field)}`])}
      >
        <Close fontSize="inherit" />
      </IconButton>
    </div>
  );
};
const RenderStringArray = ({ data, handleClearFilter }: { data: FilterStringArray; handleClearFilter: (keys: string[]) => void }) => {
  const title = startCase(data.field);
  if (data?.term?.length === 0) return null;
  return (
    <div className={cn(chipClassName)} title={data.term.join(', ')}>
      <span className={cn(textClassName)}>
        {title}: {data.term.join(', ')}
      </span>
      <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
        <Close fontSize="inherit" />
      </IconButton>
    </div>
  );
};
const RenderObjectArray = ({ data, handleClearFilter }: { data: FilterObjectArray; handleClearFilter: (keys: string[]) => void }) => {
  const title = startCase(data.field);
  if (data?.term?.length === 0) return null;
  return (
    <div className={cn(chipClassName)} title={data.term?.map?.((d) => d?.optionLabel).join(', ') || ''}>
      <span className={cn(textClassName)}>
        {title}: {data.term?.map?.((d) => d?.optionLabel).join(', ') || ''}
      </span>
      <IconButton size="small" style={buttonStyle} onClick={() => handleClearFilter([data.field])}>
        <Close fontSize="inherit" />
      </IconButton>
    </div>
  );
};
