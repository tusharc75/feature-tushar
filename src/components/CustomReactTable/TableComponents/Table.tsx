import { Row, Table } from '@tanstack/react-table';
import React, { Dispatch, ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { NormalTable } from 'src/components/CustomReactTable/TableComponents/NormalTable';
import { VirtualTable } from 'src/components/CustomReactTable/TableComponents/VirtualTable';
import { TActios, TInitialState } from '../hooks/useTableReducer';
import { getStickyColumnNames, getStickyPosition2 } from '../utils';
import { TColType } from './TableHelperComponents';

type StickyColumns = ReturnType<typeof getStickyColumnNames>;

type TTableProps = {
  state: TInitialState;
  setWholeRowsCellColor: any;
  dispatch: Dispatch<TActios>;
  table: Table<any>;
  setCellValue: React.Dispatch<React.SetStateAction<string>>;
  submitInput: () => void;
  cellValue: string;
  resetField: () => void;
  isClientSideGrid: boolean;
  loading: boolean;
  error: boolean;
  height?: any;
  exportTableView?: boolean;
  virtualization: boolean;
  onRowClick: (row: Row<any>) => void;
  resource: string;
  pagination?: boolean;
  expander: boolean;
  hideSelection: boolean;
  expanderWithCustomContent: boolean;
  customContentHeight: number;
  customContent: ({ row }: { row: any }) => React.ReactNode;
  renderedFrom: string;
  sortedColumns: TColType[];
};

const TableComponent = forwardRef(function (
  {
    state,
    setWholeRowsCellColor,
    table,
    dispatch,
    setCellValue,
    submitInput,
    cellValue,
    resetField,
    isClientSideGrid,
    loading,
    error,
    height,
    exportTableView = false,
    virtualization = false,
    onRowClick,
    resource,
    pagination,
    expander,
    hideSelection,
    expanderWithCustomContent,
    customContentHeight,
    customContent,
    renderedFrom,
    sortedColumns
  }: TTableProps,
  ref: ForwardedRef<HTMLTableElement>
) {
  const { filters: customFilters, initialDataLoaded, visibleColumns }: TInitialState = state;

  const tableColumns = table.getVisibleFlatColumns();

  const { columns, orderedColumns } = useMemo(() => {
    const columns = [];
    const orderedColumns = sortedColumns
      ?.filter((d) => visibleColumns[d.id] !== false)
      .reduce((acc, curr, index) => {
        columns.push(curr);
        acc[curr.id] = index;
        return acc;
      }, {});

    return { orderedColumns, columns };
  }, [sortedColumns, visibleColumns]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sizes = tableColumns?.sort((a, b) => orderedColumns[a.id] - orderedColumns[b.id])?.map((c) => c.getSize()) || [];

  const vtableData = useMemo(() => {
    if (!columns || columns.length === 0) return null;
    return columns?.map((d, i) => getStickyPosition2(d, i, sizes));
  }, [columns, sizes]);

  const stickyColumns = useMemo(() => {
    const stickyData = getStickyColumnNames({ allColumn: columns, expander, hideSelection });
    return stickyData;
  }, [expander, hideSelection, columns]);

  const tableRef = useRef<HTMLTableElement | null>(null);

  useImperativeHandle(
    ref,
    function () {
      return tableRef.current;
    },
    []
  );

  let rows: Row<any>[];
  if (exportTableView) {
    rows = table.getExpandedRowModel().flatRows;
  } else {
    rows = table.getRowModel().rows;
  }

  const excludedColumns = ['action', 'selection', 'expander'];

  const footerRowFound = table?.getFooterGroups()[0].headers.some((h) => h.column.columnDef.footer);
  const tableRowsLengthGreterThanZero = table.getRowModel().rows.length > 0;
  const isFooterVisible = isClientSideGrid && footerRowFound && tableRowsLengthGreterThanZero;

  const handleChangeCurrentEditingCellPosition = (rowid: string, columnId: string) => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: {
        rowId: rowid,
        columnName: columnId
      }
    });
  };

  return (
    <>
      {exportTableView ? (
        <>
          <NormalTable
            state={state}
            setWholeRowsCellColor={setWholeRowsCellColor}
            table={table}
            dispatch={dispatch}
            setCellValue={setCellValue}
            submitInput={submitInput}
            cellValue={cellValue}
            resetField={resetField}
            isClientSideGrid={isClientSideGrid}
            loading={loading}
            error={error}
            height={height}
            exportTableView={exportTableView}
            virtualization={virtualization}
            onRowClick={onRowClick}
            resource={resource}
            pagination={pagination}
            isFooterVisible={isFooterVisible}
            rows={rows}
            initialDataLoaded={initialDataLoaded}
            customFilters={customFilters}
            tableRef={tableRef}
            excludedColumns={excludedColumns}
            footerRowFound={footerRowFound}
            stickyColumns={stickyColumns}
            renderedFrom={renderedFrom}
          />
        </>
      ) : (
        <>
          <VirtualTable
            columns={tableColumns}
            sizes={sizes}
            state={state}
            setWholeRowsCellColor={setWholeRowsCellColor}
            table={table}
            dispatch={dispatch}
            setCellValue={setCellValue}
            submitInput={submitInput}
            cellValue={cellValue}
            resetField={resetField}
            isClientSideGrid={isClientSideGrid}
            loading={loading}
            error={error}
            height={height}
            exportTableView={exportTableView}
            virtualization={virtualization}
            onRowClick={onRowClick}
            resource={resource}
            pagination={pagination}
            isFooterVisible={isFooterVisible}
            rows={rows}
            initialDataLoaded={initialDataLoaded}
            customFilters={customFilters}
            tableRef={tableRef}
            excludedColumns={excludedColumns}
            footerRowFound={footerRowFound}
            stickyColumns={stickyColumns}
            handleChangeCurrentEditingCellPosition={handleChangeCurrentEditingCellPosition}
            vtableData={vtableData}
            expanderWithCustomContent={expanderWithCustomContent}
            customContentHeight={customContentHeight}
            customContent={customContent}
            renderedFrom={renderedFrom}
          />
        </>
      )}
    </>
  );
});

export type RnderTableProps = {
  state: TInitialState;
  setWholeRowsCellColor: any;
  dispatch: Dispatch<TActios>;
  table: Table<any>;
  setCellValue: React.Dispatch<React.SetStateAction<string>>;
  submitInput: () => void;
  cellValue: string;
  resetField: () => void;
  isClientSideGrid: boolean;
  loading: boolean;
  error: boolean;
  height?: any;
  exportTableView?: boolean;
  virtualization: boolean;
  onRowClick: (row: Row<any>) => void;
  resource: string;
  pagination?: boolean;
  isFooterVisible: boolean;
  rows: Row<any>[];
  initialDataLoaded: boolean;
  customFilters: any;
  tableRef: React.MutableRefObject<HTMLTableElement>;
  excludedColumns: string[];
  footerRowFound: boolean;
  stickyColumns: StickyColumns;
  renderedFrom: string;
};

export default React.memo(TableComponent);
