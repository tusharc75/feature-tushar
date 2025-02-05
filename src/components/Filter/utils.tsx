import dayjs from 'dayjs';
import { startCase } from 'lodash';
import { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDate } from 'src/constants/helpers';

export const getLabel = (field: ColumnDefaultT, values: { field: string; term: string | any[] }[]) => {
  if (field?.type === 'date') {
    const value: any = values?.find((d) => d?.field === field?.fieldName)?.term;
    if (value?.from || value?.to) {
      let formattedMessage = `${value?.from ? `From: ${displayDate(value?.from)}` : ''} ${value?.to ? `To: ${displayDate(value?.to)}` : ''}`;
      return (
        <HtmlTooltip title={formattedMessage}>
          <span>{value?.from && value?.to ? 2 : 1}</span>
        </HtmlTooltip>
      );
    }
  } else {
    const value: any = values?.find((d) => d?.field === field?.fieldName)?.term;
    if (!value) return '';
    if (field?.type === 'date') {
      if (value?.from || value?.to) {
        let formattedMessage = `${value?.from ? `From: ${displayDate(value?.from)}` : ''} ${value?.to ? `To: ${displayDate(value?.to)}` : ''}`;
        return (
          <HtmlTooltip title={formattedMessage}>
            <span>{value?.from && value?.to ? 2 : 1}</span>
          </HtmlTooltip>
        );
      }
    }
    if (field?.type === 'checkBox' && value) {
      return (
        <HtmlTooltip title={value}>
          <span>1</span>
        </HtmlTooltip>
      );
    }
    if (Array.isArray(value)) {
      return value.length;
    }
    if (typeof value === 'string' && value) {
      return (
        <HtmlTooltip title={startCase(value)}>
          <span>1</span>
        </HtmlTooltip>
      );
    }
    if (typeof value === 'object' && !field?.multiple) {
      if (Object.keys(value).length) {
        return (
          <HtmlTooltip title={startCase(value ? value['optionLabel'] : '')}>
            <span>1</span>
          </HtmlTooltip>
        );
      }
      return '';
    }

    if (typeof value === 'object' || Object.keys(value).length) {
      return Object.keys(value).length;
    }
  }
  return '';
};

export const isCLearFilterButtonVisible = (defaultColumnsMap: { [key: string]: boolean }, uniqueValues = []) => {
  const newData = uniqueValues.map((d) => ({
    ...d,
    field: d.field.replace('from_', '').replace('to_', '')
  }));
  return (
    newData.filter((d) => {
      if (defaultColumnsMap[d.field]) {
        return false;
      }
      if (Array.isArray(d.term)) {
        return d.term.length > 0;
      }
      if (typeof d.term === 'object') {
        return Object.keys(d.term).length > 0;
      }
      return d.term;
    }).length > 0
  );
};

type ColumnDefaultT = {
  fieldLabel: string;
  fieldName: string;
  required: boolean;
  resource: string;
  type: string;
  lookup?: boolean;
  multiple?: boolean;
};

export const getErrors = (
  defaultColumns: ColumnDefaultT[] = [],
  values: { field: string; term: string | any[] }[]
): { errors: { [key: string]: boolean }; errorColumns: ColumnDefaultT[] } => {
  const errors: { [key: string]: boolean } = {};
  const errorColumns: ColumnDefaultT[] = [];

  for (const c of defaultColumns) {
    if (c?.type === 'date') {
      const value: any = values?.find((d) => d?.field === c?.fieldName)?.term;
      const isBothValuePresent = value?.from && value?.to;
      if (!isBothValuePresent) {
        errors[c.fieldName] = true;
        errorColumns.push(c);
        continue;
      }
    } else {
      const value = values?.find((d) => d?.field === c?.fieldName)?.term;
      if (!value) {
        errors[c.fieldName] = true;
        errorColumns.push(c);
        continue;
      }
      if ((typeof value === 'string' || Array.isArray(value)) && value.length === 0) {
        errors[c.fieldName] = true;
        errorColumns.push(c);
        continue;
      }
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        errors[c.fieldName] = true;
        errorColumns.push(c);
        continue;
      }
    }
  }
  return { errors, errorColumns };
};

export const useClassForFewSeconds = (cName: string, duration = 1000) => {
  const [className, setShow] = useState('');
  const addClass = () => {
    setShow(cName);
    setTimeout(() => {
      setShow('');
    }, duration);
  };
  return { className, addClass };
};
