import { flatMapDeep, isEmpty, snakeCase, uniqBy } from 'lodash';
import moment from 'moment';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import xlsx from 'xlsx-js-style';
import { TColType } from './TableComponents/TableHelperComponents';
import { FilterModel } from './types';
import { Column, Header, Table } from '@tanstack/react-table';

export const childrenProperty = 'subRows';

export const gridFilterParser = (filters) => {
  const filterByIds: any = [];
  const deepFilters: any = [];
  if (!isEmpty(filters)) {
    Object.keys(filters).forEach((field) => {
      if (filters[field].operator && filters[field].condition1) {
        filterByIds.push({
          field: field,
          term: { $in: filters[field].condition1?.filter?.map((e) => e.optionValue) }
        });
      } else {
        deepFilters.push({
          field: field,
          term: Array.isArray(filters[field].filter) ? filters[field].filter : filters[field].filter
        });
      }
    });
  }

  return { filterByIds, deepFilters };
};

export const getStickyPosition = (columnDef: TColType, index, table) => {
  const obj = {
    className: columnDef.sticky ? `sticky-cell-${columnDef.sticky}` : '',
    style: {}
  };

  if (columnDef.sticky === undefined) return obj;
  const colSizes = table.getAllColumns().map((c) => c.getSize());

  const addSizes = (index: number) => {
    if (columnDef.sticky === 'left') {
      let sum = 0;
      for (let i = 0; i < index; i++) {
        sum += colSizes[i];
      }
      return sum;
    }
    if (columnDef.sticky === 'right') {
      if (columnDef.id === 'action') {
        return 0;
      }
      let sum = 0;
      for (let i = colSizes.length - 1; i > index; i--) {
        sum += colSizes[i];
      }

      return sum;
    }
  };

  if (['left', 'right'].includes(columnDef.sticky)) {
    const offset = addSizes(index);
    obj.style = { position: 'sticky', [columnDef.sticky]: offset } as React.CSSProperties;
  }

  return obj;
};

export const getStickyPosition2 = (columnDef: TColType, index, colSizes) => {
  const obj = {
    className: columnDef.sticky ? `sticky-cell-${columnDef.sticky}` : '',
    style: {}
  };

  if (columnDef.sticky === undefined) return obj;

  const addSizes = (index: number) => {
    if (columnDef.sticky === 'left') {
      let sum = 0;
      for (let i = 0; i < index; i++) {
        sum += colSizes[i];
      }
      return sum;
    }
    if (columnDef.sticky === 'right') {
      if (columnDef.id === 'action') {
        return 0;
      }
      let sum = 0;
      for (let i = colSizes.length - 1; i > index; i--) {
        sum += colSizes[i];
      }

      return sum;
    }
  };

  if (['left', 'right'].includes(columnDef.sticky)) {
    const offset = addSizes(index);
    obj.style = { position: 'sticky', [columnDef.sticky]: offset } as React.CSSProperties;
  }

  return obj;
};

export function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  React.useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}

export const handleKeyDown = ({ e, currentEditingCellPosition, submitInput }) => {
  if (!currentEditingCellPosition) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    submitInput();
  }
};

export const handleCellClick = ({ cell, row, dispatch, setCellValue }) => {
  if (!cell.column.id || !row.original._id || !cell?.column?.columnDef.editable) return;
  dispatch({
    type: 'currentEditingCellPosition',
    cellPosition: {
      rowId: row.original._id,
      columnName: cell.column.id
    }
  });

  setCellValue(getCellValue(cell) || null);
};

export const insertChildRowIntoTable = ({ existingRows, subRowsToInsert, dispatch, parentId }) => {
  const updatedRows = [...existingRows];

  for (let row of updatedRows) {
    if (row._id === parentId) {
      if (subRowsToInsert.length > 0) {
        row.subRows = subRowsToInsert;
      } else {
        row.canExpand = false;
      }
      break;
    } else if (row.subRows) {
      insertChildRowIntoTable({
        existingRows: row.subRows,
        subRowsToInsert,
        parentId,
        dispatch
      });
    }
  }

  dispatch({
    type: 'update',
    data: updatedRows
  });

  return updatedRows;
};

export const getStickyColumnNames = ({
  allColumn = [],
  expander,
  hideSelection
}: {
  allColumn: TColType[];
  expander: boolean;
  hideSelection: boolean;
}) => {
  const left: string[] = [];
  const right: string[] = [];
  const stickyColumns = [];
  const stickyIndexes: number[] = [];
  const leftIndexes: number[] = [];
  const rightIndexes: number[] = [];
  const columns = {
    left: [],
    right: [],
    normal: []
  };
  for (let i = 0; i < allColumn.length; i++) {
    const col = allColumn[i];
    const colName = col?.id ?? col?.accessor;
    if (colName === 'expander' && expander) {
      left.push(colName);
      leftIndexes.push(i);
      stickyColumns.push(colName);
      stickyIndexes.push(i);
      columns.left.push(col);
      continue;
    }
    if (colName === 'selection' && !hideSelection) {
      left.push(colName);
      leftIndexes.push(i);
      stickyColumns.push(colName);
      stickyIndexes.push(i);
      columns.left.push(col);
      continue;
    }
    if (col.sticky === 'left') {
      left.push(colName);
      leftIndexes.push(i);
      stickyColumns.push(colName);
      stickyIndexes.push(i);
      columns.left.push(col);
      continue;
    }
    if (col.sticky === 'right') {
      right.push(colName);
      rightIndexes.push(i);
      stickyColumns.push(colName);
      stickyIndexes.push(i);
      columns.right.push(col);
      continue;
    }
    columns.normal.push(col);
  }
  return { left, right, stickyColumns, stickyIndexes, leftIndexes, rightIndexes, columns };
};

export const getStickyColumnNamesFromTableColumns = ({
  allColumn = [],
  expander,
  hideSelection,
  sizes: propSizes = [],
  headers,
  footers,
  columnOrder
}: {
  allColumn: Column<any, unknown>[];
  expander: boolean;
  hideSelection: boolean;
  sizes?: number[];
  headers: Header<any, unknown>[];
  footers: Header<any, unknown>[];
  columnOrder: string[];
}) => {
  if (!allColumn || !Array.isArray(allColumn) || allColumn.length === 0) return;
  const sortedColumns = allColumn.sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id));
  // const columns = {
  //   left: [],
  //   right: [],
  //   normal: []
  // };
  const sizes = {
    left: [],
    right: [],
    normal: []
  };
  const headersData = {
    left: [],
    right: [],
    normal: []
  };
  const footerData = {
    left: [],
    right: [],
    normal: []
  };
  const columnIndexes = {
    left: [],
    right: [],
    normal: []
  };
  let leftTotlaSize = 0;
  let rightTotalSize = 0;
  for (let i = 0; i < allColumn.length; i++) {
    const col = sortedColumns[i];
    const header = headers[i];
    const footer = footers[i];
    const colDef = col.columnDef as TColType;
    const colName = colDef?.id ?? colDef?.accessor;
    const colSize = propSizes[i] || 200;

    if (colName === 'expander' && expander) {
      // columns.left.push(colDef);
      sizes.left.push(colSize);
      leftTotlaSize += colSize;
      columnIndexes.left.push(i);
      headersData.left.push(header);
      footerData.left.push(footer);
      continue;
    }
    if (colName === 'selection' && !hideSelection) {
      // columns.left.push(colDef);
      sizes.left.push(colSize);
      leftTotlaSize += colSize;
      columnIndexes.left.push(i);
      headersData.left.push(header);
      footerData.left.push(footer);
      continue;
    }
    if (colDef.sticky === 'left') {
      // columns.left.push(colDef);
      sizes.left.push(colSize);
      leftTotlaSize += colSize;
      columnIndexes.left.push(i);
      headersData.left.push(header);
      footerData.left.push(footer);
      continue;
    }
    if (colDef.sticky === 'right') {
      // columns.right.push(colDef);
      sizes.right.push(colSize);
      rightTotalSize += colSize;
      columnIndexes.right.push(i);
      headersData.right.push(header);
      footerData.right.push(footer);
      continue;
    }
    // columns.normal.push(colDef);
    sizes.normal.push(colSize);
    headersData.normal.push(header);
    footerData.normal.push(footer);
    columnIndexes.normal.push(i);
  }

  return {
    // columns,
    sizes,
    leftTotlaSize,
    rightTotalSize,
    headers: headersData,
    columnIndexes,
    footerData
  };
};

export const getUniqueRows = (rows: any[], key = '_id') => {
  const arrayUniqueByKey = uniqBy(rows, (d) => `${d[key]}_${d.index || 0}`);
  return arrayUniqueByKey;
};

export const getCellValue = (cell) => {
  const { row, column } = cell;
  if (column?.columnDef?.editable && column?.columnDef?.type === 'dropDown') {
    return row.original[`${column.id}Id`];
  }
  if (column?.columnDef?.editable && column?.columnDef?.type === 'multiSelect') {
    return [
      ...(row.original[`${column.id}Id`] ? [row.original[`${column.id}Id`]] : []),
      ...(row.original[`rest${column.id}`]?.map((o) => o?.optionValue) || [])
    ];
  }
  return row.original[column.id];
};

export const fetchFieldOptions = async ({ resource, sidebarResource, toastConfig = null }) => {
  const FILTER_NOT_APPLIED = [
    'fileUpload',
    'multiFileUpload',
    'imageUpload',
    'multiImageUpload',
    'richTextEditor',
    'signature',
    'groupSignature',
    'colorPicker',
    'counter',
    'description',
    'switch'
  ];

  try {
    const req = await axiosInstance().get(`/field?resource=${resource}&view=true`);
    const {
      data: { data }
    } = req;
    let coloum = data?.filter((e) => !FILTER_NOT_APPLIED.includes(e?.fieldData?.type));
    if (resource === sidebarResource.user || resource === sidebarResource.employeeMaster) {
      coloum?.forEach((e) => {
        if (e?.fieldData?.fieldName === 'firstName') {
          e.fieldData.fieldName = 'concatedName';
          e.fieldData.fieldLabel = 'Name';
          e.fieldData.type = 'singleLine';
        }
      });
      coloum = coloum?.filter((e) => e?.fieldData?.fieldName !== 'lastName');
    } else if (resource === sidebarResource.customerContact || resource === sidebarResource.supplierContact || resource === sidebarResource.lead) {
      coloum?.forEach((e) => {
        if (e?.fieldData?.fieldName === 'firstName') {
          e.fieldData.fieldName = 'concatedName';
          e.fieldData.fieldLabel = 'Name';
          e.fieldData.type = 'singleLine';
        }
      });
      coloum = coloum?.filter((e) => !['lastName', 'middleName', 'salutation']?.includes(e?.fieldData?.fieldName));
    }
    if (resource === sidebarResource.serializedAsset) {
      const currentOwner: any = coloum?.find((e) => e?.fieldData?.fieldName === 'currentOwner');
      if (currentOwner) {
        currentOwner.fieldData.lookup = true;
        currentOwner.fieldData.option = [
          ...(coloum?.find((e) => e?.fieldData?.lookupResource === sidebarResource.customerAccount)?.fieldData?.option || []),
          ...(coloum?.find((e) => e?.fieldData?.lookupResource === sidebarResource.supplierAccount)?.fieldData?.option || [])
        ];
      }
    }
    return coloum;
  } catch (error) {
    if (toastConfig) toastConfig.setToastConfig?.(error);
    throw error;
  }
};

const flatDataRowsItem = (mem) => {
  const member = { ...mem };
  delete member[childrenProperty];
  if (!mem[childrenProperty] || !mem[childrenProperty].length) {
    return member;
  }
  return [member, flatMapDeep(mem[childrenProperty], flatDataRowsItem)];
};

export function normalizeRowData(array) {
  return flatMapDeep(array, flatDataRowsItem);
}

export function camelCaseToWords(s: string) {
  const result = s.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function alphaToNum(alpha) {
  let i = 0,
    num = 0,
    len = alpha.length;
  for (; i < len; i++) {
    num = num * 26 + alpha.charCodeAt(i) - 0x40;
  }
  return num - 1;
}

export function numToAlpha(num: any) {
  let alpha: any = '';
  for (; num >= 0; num = parseInt(num / 26, 10) - 1) {
    alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
  }
  return alpha;
}

export function getExcelColumnNameFromRange(range) {
  let res = [],
    rangeNum = range.split(':').map(function (val) {
      return alphaToNum(val.replace(/[0-9]/g, ''));
    }),
    start = rangeNum[0],
    end = rangeNum[1] + 1;

  for (let i = start; i < end; i++) {
    res.push(numToAlpha(i));
  }

  return res;
}

export function extractLastNumberFromDataRange(input: string): number | null {
  const regex = /(\d+)(?!.*\d)/;
  const match = input.match(regex);
  return match ? parseInt(match[1], 10) : null;
}

export function fitToColumn(columns, ws: xlsx.WorkSheet, padding = 5) {
  // get maximum character of each column
  const wch = [];
  for (const a of columns) {
    if (ws[`${a}1`]) {
      wch.push({ wch: Math.max(ws[`${a}1`]?.v?.toString().length + padding, 15) });
    }
  }
  return wch;
}

export const createFilterModel = (formValues, coloums) => {
  const filterModel = new Map();
  const colNames = Object.keys(formValues);

  for (const col of coloums) {
    const fieldName = col?.fieldName;

    if (
      !(colNames.includes(fieldName) || colNames.includes(`from_${fieldName}`) || colNames.includes(`to_${fieldName}`)) &&
      (col.type !== 'dateTime' || col.type !== 'date')
    ) {
      continue;
    }

    switch (col.type) {
      case 'singleLine':
        if (formValues[fieldName]) {
          filterModel.set(fieldName, { filter: formValues[fieldName] });
        }
        break;
      case 'lookUpDisplay':
        if (formValues[fieldName]) {
          filterModel.set(fieldName, { filter: formValues[fieldName] });
        }
        break;
      case 'number':
      case 'decimal':
        if (formValues[fieldName]) {
          filterModel.set(fieldName, { filter: formValues[fieldName] });
        }
        break;
      case 'multiLine':
      case 'email':
      case 'mobileNumber':
      case 'currency':
      case 'location':
      case 'url':
        if (formValues[fieldName]?.trim()) {
          filterModel.set(fieldName, { filter: formValues[fieldName]?.trim() });
        }
        break;
      case 'year':
        if (formValues[fieldName]) {
          filterModel.set(fieldName, { filter: moment(new Date(formValues[fieldName])).format('YYYY') });
        }
        break;
      case 'multiSelect':
      case 'dropDown':
        if ((col.lookup || col.dataList) && formValues[fieldName]) {
          if (col.type === 'multiSelect' && formValues[fieldName]?.length > 0) {
            filterModel.set(fieldName, {
              operator: 'OR',
              condition1: {
                filter: formValues[fieldName] ?? []
              }
            });
          }
        } else if (col.type === 'multiSelect' && formValues[fieldName]?.length > 0) {
          filterModel.set(fieldName, { filter: formValues[fieldName] });
        }
        break;
      case 'dateTime':
      case 'date':
        const from = `from_${fieldName}`;
        const to = `to_${fieldName}`;

        const fromDate = formValues[from] ? formValues[from] : null;
        const toDate = formValues[to] ? formValues[to] : null;

        if (fromDate || toDate) {
          filterModel.set(fieldName, {
            filter: {
              from: fromDate ? moment(new Date(fromDate)).format('MM/DD/YYYY') : null,
              to: toDate ? moment(new Date(toDate)).format('MM/DD/YYYY') : null
            }
          });
        }
        break;
      case 'checkBox':
        if (formValues[fieldName] === true || formValues[fieldName] === false || formValues[fieldName] === 'true') {
          filterModel.set(fieldName, { filter: formValues[fieldName] === true || formValues[fieldName] === 'true' ? 'Yes' : 'No' });
        }
        break;
      case 'gpsLocation':
        if (formValues[fieldName] && formValues[fieldName]?.locationName) {
          filterModel.set(fieldName, { filter: formValues[fieldName]?.locationName });
        }
        break;
      default:
        // Handle unexpected column types.
        console.warn('Unknown column type:', col.type);
    }
  }

  return Object.fromEntries(filterModel);
};

export const createFilterData = (coloums, filterByIds, deepFilters, filterTerm) => {
  const dateFields: any = [];
  coloums
    ?.filter((c) => c?.fieldData?.type === 'date')
    ?.map((c) => {
      dateFields.push(`from_${c?.fieldData?.fieldName}`);
      dateFields.push(`to_${c?.fieldData?.fieldName}`);
    });

  let filterById: any = [];
  let deepFilter: any = [];

  if (filterByIds?.length > 0) {
    filterById = filterByIds
      ?.filter((f) => f?.term?.length > 0)
      ?.map((f) => {
        const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
        return {
          field: f?.field,
          term: {
            [term]: f?.term?.map?.((d: any) => d.optionValue)
          }
        };
      });
  }

  if (deepFilters?.length > 0) {
    deepFilter = [
      ...deepFilter,
      ...deepFilters
        ?.filter((d) => {
          const hasTermLength = d?.term?.length ? true : false;
          if (dateFields?.length > 0) {
            return hasTermLength && !dateFields?.includes(d?.field);
          }
          return hasTermLength;
        })
        ?.map((d) => {
          if (filterTerm[d?.field] === '$nin' && Array.isArray(d?.term)) {
            return {
              ...d,
              term: { $nin: d?.term }
            };
          }
          return d;
        })
    ];

    coloums
      ?.filter((c) => c?.fieldData?.type === 'date')
      ?.map((f) => {
        if (deepFilters?.some((d) => [`from_${f?.fieldData?.fieldName}`, `to_${f?.fieldData?.fieldName}`].includes(d?.field))) {
          deepFilter.push({
            field: f?.fieldData?.fieldName,
            term: {
              from: deepFilters?.find((d) => d?.field === `from_${f?.fieldData?.fieldName}`)
                ? deepFilters?.find((d) => d?.field === `from_${f?.fieldData?.fieldName}`)?.term
                : null,
              to: deepFilters?.find((d) => d?.field === `to_${f?.fieldData?.fieldName}`)
                ? deepFilters?.find((d) => d?.field === `to_${f?.fieldData?.fieldName}`)?.term
                : null
            }
          });
        }
      });
  }

  return { filterById, deepFilter };
};

export const createFilterSetData = (val, columns) => {
  const filterById: any = [];
  const deepFilter: any = [];
  Object.keys(val?.filterValue || {})?.map((v) => {
    if (val?.filterValue[v]?.length > 0) {
      const col = columns?.find((c) => c?.fieldData?.fieldName === v);
      if (col?.fieldData?.lookup) {
        filterById.push({
          field: v,
          term: val?.filterValue[v]
        });
      } else {
        deepFilter.push({
          field: v,
          term: val?.filterValue[v]
        });
      }
    }
  });

  return { filterById, deepFilter };
};

export const filtermodelToFormValue = (filtermodel: FilterModel) => {
  const formValues = {};
  for (const [key, value] of Object.entries(filtermodel)) {
    if (value.filter?.['from'] || value.filter?.['to']) {
      formValues[`from_${snakeCase(key)}`] = new Date(value.filter['from']);
      formValues[`to_${snakeCase(key)}`] = new Date(value.filter['to']);
    } else if (value['operator'] === 'OR') {
      formValues[key] = value.condition1?.filter.map((e) => e.optionValue);
    } else if (value.filter) {
      formValues[key] = value.filter;
    }
  }
  return formValues;
};

export function adjustSizes(original: TColType[], visibleColumns: { [key: string]: boolean }, containerSize: number): TColType[] | null {
  const visibleColumnsArray = original.filter((col) => visibleColumns[col.id || col.accessor]);
  const totalSize = visibleColumnsArray.reduce((acc, size) => acc + (size.size || 200), 0);

  if (totalSize >= containerSize) {
    return original; // No adjustment needed if total size is greater than or equal to container size
  }

  const maxWidthColumnsSum = visibleColumnsArray.reduce((acc, size) => acc + (size.maxSize || 0), 0);
  const scaleFactor = (containerSize - maxWidthColumnsSum) / (totalSize - maxWidthColumnsSum);
  if (scaleFactor === Infinity) {
    return null;
  }
  const scrollerWidth = 0;

  return original.map((col) => {
    const size = Math.floor((col.size || 200) * scaleFactor) - scrollerWidth;
    return { ...col, size };
  });
}
