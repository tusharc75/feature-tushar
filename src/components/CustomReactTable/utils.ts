import { isEmpty } from 'lodash';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
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

  setCellValue(cell?.getValue() || null);
};

export const insertChildRowIntoTable = ({ existingRows, subRowsToInsert, parentId, dispatch }) => {
  const updatedRows = [...existingRows];

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
