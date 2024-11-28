import { Row, Table } from '@tanstack/react-table';
import React, { Dispatch, ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { NormalTable } from 'src/components/CustomReactTable/TableComponents/NormalTable';
import { VirtualTable } from 'src/components/CustomReactTable/TableComponents/VirtualTable';
import { TActios, TInitialState } from '../hooks/useTableReducer';
import { getStickyColumnNames, getStickyColumnNamesFromTableColumns } from '../utils';
import { TColType } from './TableHelperComponents';
import VirtualTableWithReactVirtual from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual';

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
    hideSelection
  }: TTableProps,
  ref: ForwardedRef<HTMLTableElement>
) {
  const { filters: customFilters, initialDataLoaded, columnOrder }: TInitialState = state;
  const tableColumns = table.getVisibleFlatColumns();
  const columns = tableColumns?.map((d) => d?.columnDef);
  const sizes = tableColumns?.map((c) => c.getSize()) || [];
  const headers = table.getHeaderGroups()[0].headers;
  const footers = table.getFooterGroups()[0].headers;

  const stickyColumns = useMemo(() => {
    const stickyData = getStickyColumnNames({ allColumn: columns as TColType[], expander, hideSelection });
    return stickyData;
  }, [expander, hideSelection, columns]);

  const tableData = useMemo(() => {
    const newCol = getStickyColumnNamesFromTableColumns({
      allColumn: tableColumns,
      expander,
      hideSelection,
      sizes: sizes,
      headers,
      footers,
      columnOrder
    });
    return newCol;
  }, [expander, hideSelection, sizes, tableColumns, headers, footers, columnOrder]);

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

  // const footers;

  const footerRowFound = table?.getFooterGroups()[0].headers.some((h) => h.column.columnDef.footer);

  const tableRowsLengthGreterThanZero = table.getRowModel().rows.length > 0;

  const isFooterVisible = useMemo(
    () => isClientSideGrid && footerRowFound && tableRowsLengthGreterThanZero,
    [footerRowFound, isClientSideGrid, tableRowsLengthGreterThanZero]
  );

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
          />
        </>
      ) : (
        <>
          <VirtualTableWithReactVirtual
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
            tableData={tableData}
          />
          {/* <VirtualTable
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
          /> */}
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
};

export default TableComponent;
