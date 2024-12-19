import { startCase } from 'lodash';
import { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export const getLabel = (field: ColumnDefaultT, values: { field: string; term: string | any[] }[]) => {
  if (field?.type === 'date') {
    const found = values?.filter((d) => [`from_${field?.fieldName}`, `to_${field?.fieldName}`].includes(d?.field)).filter((d) => d.term);
    if (found.length > 0) {
      let formattedMessage = '';
      found.forEach((d) => {
        if ((d.field as string).startsWith('from_')) {
          formattedMessage += `From: ${d.term}`;
        } else if ((d.field as string).startsWith('to_')) {
          formattedMessage += `${found.length === 2 ? ', ' : ''}To: ${d.term}`;
        }
      });
      return (
        <HtmlTooltip title={formattedMessage}>
          <span>{found.length}</span>
        </HtmlTooltip>
      );
    }
  } else {
    const value = values?.find((d) => d?.field === field?.fieldName)?.term;
    if (!value) return '';
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
};

export const getErrors = (
  defaultColumns: ColumnDefaultT[] = [],
  values: { field: string; term: string | any[] }[]
): { errors: { [key: string]: boolean }; errorColumns: ColumnDefaultT[] } => {
  const errors: { [key: string]: boolean } = {};
  const errorColumns: ColumnDefaultT[] = [];

  for (const c of defaultColumns) {
    if (c?.type === 'date') {
      const isBothValuePresent =
        values?.find((d) => d?.field === `from_${c?.fieldName}`)?.term && values?.find((d) => d?.field === `to_${c?.fieldName}`)?.term;
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
        console.log(c);
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
