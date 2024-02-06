import { isEmpty } from 'lodash';
import moment from 'moment';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { dateFormat, dateTimeFormat, formatAmountWithCurrency } from 'src/constants/helpers';
import { TColType } from './TableComponents/TableHelperComponents';

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

let timeout;
export const updateGridHiddenColumns = ({
  hiddenColumns = [],
  columnOrder = [],
  renderedFrom,
  user,
  callback
}: {
  hiddenColumns?: string[];
  columnOrder?: string[];
  renderedFrom: string;
  user: any;
  callback?: (data) => void;
}) => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(function () {
    let data = localStorage.getItem('gridMetaData');
    let request = data === 'undefined' ? {} : { ...JSON.parse(data) };

    if (request[renderedFrom]) {
      request[renderedFrom].order = columnOrder.length > 0 ? columnOrder : request[renderedFrom].order;
      request[renderedFrom].hide = hiddenColumns.length > 0 ? hiddenColumns : request[renderedFrom].hide;
    } else {
      request[renderedFrom] = {
        order: columnOrder,
        hide: hiddenColumns
      };
    }
    if (callback) callback(request[renderedFrom]);
    postGridMetadata(request, user, callback);
  }, 600);
};

const postGridMetadata = (request, user, callback) => {
  axiosInstance()
    .post(`user/meta-grid`, {
      _id: user?.user?._id,
      gridMetaData: { ...request }
    })
    .then((data) => {
      fetchGridMetaData(user);
    });
};

const fetchGridMetaData = (user) => {
  axiosInstance()
    .get(`user/meta-grid/${user?.user?._id}`)
    .then(({ data: { data } }) => {
      let tempMetaData = JSON.stringify(data?.gridMetaData);
      localStorage.setItem('gridMetaData', tempMetaData);
    });
};

export const getDataFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('gridMetaData');
    return data && data !== 'undefined' ? JSON.parse(data) : false;
  } catch (ex) {
    return false;
  }
};

export const getTableDataFromLocalStorage = (renderedFrom: string): { hide?: string[]; order?: string[] } | false => {
  const data = getDataFromLocalStorage();
  if (!data) return false;
  return data[renderedFrom] || false;
};

export const returnHiddenCols = (renderedFrom, hideAction) => {
  const gridMetaData = getDataFromLocalStorage();
  const hiddenCols = gridMetaData[renderedFrom]?.hide || [];
  if (hideAction) {
    hiddenCols.push('action');
  }
  return hiddenCols;
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
  const offset = addSizes(index);

  if (columnDef.sticky === 'left') {
    obj.style = { position: 'sticky', left: offset } as React.CSSProperties;
  }
  if (columnDef.sticky === 'right') obj.style = { position: 'sticky', right: offset } as React.CSSProperties;
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

export const insertChildRowIntoTable = ({ existingRows, subRowsToInsert, parentId, dispatch }) => {
  const updatedRows = [...existingRows];
  if (!subRowsToInsert) return;

  for (let row of updatedRows) {
    if (row._id === parentId) {
      row.subRows = subRowsToInsert;
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
  const left = [];
  const right = [];
  const stickyColumns = [];

  for (let col of allColumn) {
    const colName = col?.id ?? col?.accessor;
    if (colName === 'expander' && expander) {
      left.push(colName);
      stickyColumns.push(colName);
      continue;
    }
    if (colName === 'selection' && !hideSelection) {
      left.push(colName);
      stickyColumns.push(colName);
      continue;
    }
    if (col.sticky === 'left') {
      left.push(colName);
      stickyColumns.push(colName);
    }
    if (col.sticky === 'right') {
      right.push(colName);
      stickyColumns.push(colName);
    }
  }
  return { left, right, stickyColumns };
};

export const getUniqueDataByKey = (rows: any[], key = '_id') => {
  const arrayUniqueByKey = [...new Map(rows.map((item) => [item[key], item])).values()];
  return arrayUniqueByKey;
};

export const getCellValue = (cell) => {
  const { row, column } = cell;
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
    'colorPicker',
    'number',
    'decimal',
    'switch'
  ];

  try {
    const req = await axiosInstance().get(`/field?resource=${resource}`);
    const {
      data: { data }
    } = req;
    const coloum = data?.filter((e) => !FILTER_NOT_APPLIED.includes(e?.fieldData?.type));
    var modifiedColumn: any = coloum?.map((col: any) => {
      const d = col.fieldData;
      if (d?.type === 'dropDown') {
        d.type = 'multiSelect';
      }
      return d;
    });
    if (resource === sidebarResource.user) {
      modifiedColumn?.forEach((e) => {
        if (e.fieldName === 'firstName') {
          e.fieldName = 'concatedName';
          e.fieldLabel = 'Name';
          e.type = 'singleLine';
        }
      });
      modifiedColumn = modifiedColumn?.filter((e) => e.fieldName !== 'lastName');
    } else if (resource === sidebarResource.customerContact || resource === sidebarResource.supplierContact || resource === sidebarResource.lead) {
      modifiedColumn?.forEach((e) => {
        if (e.fieldName === 'firstName') {
          e.fieldName = 'concatedName';
          e.fieldLabel = 'Name';
          e.type = 'singleLine';
        }
      });
      modifiedColumn = modifiedColumn?.filter((e) => !['lastName', 'middleName', 'salutation']?.includes(e.fieldName));
    }
    if (resource === sidebarResource.serializedAsset) {
      const currentOwner: any = modifiedColumn?.find((e) => e.fieldName === 'currentOwner');
      if (currentOwner) {
        currentOwner.lookup = true;
        currentOwner.option = [
          ...(modifiedColumn?.find((e) => e.lookupResource === sidebarResource.customerAccount)?.option || []),
          ...(modifiedColumn?.find((e) => e.lookupResource === sidebarResource.supplierAccount)?.option || [])
        ];
      }
    }
    return modifiedColumn;
  } catch (error) {
    if (toastConfig) toastConfig.setToastConfig?.(error);
    throw error;
  }
};

export const createJsonDataForTableExport = (columns: TColType[], rowData: any[]) => {
  const data = [];
  if (!rowData || rowData.length === 0) return false;
  const noCellData = '------';

  for (let row of rowData) {
    const temp = {};
    for (let col of columns) {
      let value = row[col.id];
      switch (true) {
        case ['action', 'selection', 'expander'].includes(col.id):
          continue;
        case Boolean(col.accessorFn):
          value = col.accessorFn(row);
          break;
        case col.id === 'createdBy':
          value = `${row?.createdBy || noCellData} • ${moment(row?.createdByDate?.slice(0, 10)).format(dateFormat)}`;
          break;
        case col.id === 'updatedBy':
          value = `${row?.updatedBy || noCellData} • ${moment(row?.original?.updatedByDate?.slice(0, 10)).format(dateFormat)}`;
          break;
        case col.type === 'date':
          value = value ? moment(value).format(dateFormat) : noCellData;
          break;
        case col.type === 'dateTime':
          value = value ? moment(value).format(dateTimeFormat) : noCellData;
          break;
        case col.type === 'checkBox':
          value = Boolean(value) ? 'Yes' : 'No';
          break;
        case col.type === 'number':
          value = value ?? 0;
          break;
        case col.type === 'currencyAmount':
          value = formatAmountWithCurrency(col.currency, value)?.amountWithouCurrencyCode;
          break;
        default:
          break;
      }
      temp[col.Header] = value || noCellData;
    }
    data.push(temp);
    if (row[childrenProperty]) {
      const tempData = createJsonDataForTableExport(columns, row[childrenProperty]);
      if (tempData) data.push(...tempData);
    }
  }
  return data;
};

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
export function numToAlpha(num) {
  let alpha = '';
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
