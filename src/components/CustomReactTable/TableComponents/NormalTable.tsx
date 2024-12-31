import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Box, CircularProgress, TableBody, TableHead, TableRow } from '@mui/material';
import MaUTable from '@mui/material/Table';
import { Error } from '@mui/icons-material';
import { flexRender } from '@tanstack/react-table';
import React, { ForwardedRef, forwardRef, memo } from 'react';
import { RnderTableProps } from 'src/components/CustomReactTable/TableComponents/Table';
import { getStickyPosition } from '../utils';
import { CellRenderer, DraggableHeader, TColType } from './TableHelperComponents';

export const NormalTable = forwardRef(function (
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
    isFooterVisible,
    rows,
    initialDataLoaded,
    customFilters,
    tableRef,
    excludedColumns,
    footerRowFound,
    stickyColumns
  }: RnderTableProps,
  ref: ForwardedRef<HTMLTableElement>
) {
  return (
    <>
      <div
        style={{
          display: 'block',
          overflow: loading ? 'hidden' : 'auto',
          maxHeight: height ?? '100%',
          height: isFooterVisible && !pagination ? 'unset' : height || '100%'
        }}
        className="without-virtualization isolate z-10 border bg-[var(--dark-primary,_white)] max-[900px]:min-h-[500px]"
      >
        {!loading && !error && rows.length === 0 && initialDataLoaded && (
          <>
            <Box className=" absolute inset-0 top-[46px] -z-10 m-auto flex h-fit w-fit select-none items-center justify-center">
              <div className=" rounded-lg px-10 py-5 text-center">
                <p>No data found</p>
              </div>
            </Box>
          </>
        )}
        {(loading || error || !initialDataLoaded) && (
          <Box className="absolute inset-0 z-50 flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.2)] dark:bg-[rgba(0,0,0,0.1)]">
            <div className="rounded-lg bg-[white] px-10 py-5 text-center shadow-md dark:bg-[var(--dark-secondary)]">
              {error ? (
                <>
                  <Error className="mx-auto mb-2" />
                  <p>Something Went Wrong</p>
                </>
              ) : loading || !initialDataLoaded ? (
                <>
                  <CircularProgress />
                  <p>Loading...</p>
                </>
              ) : null}
            </div>
          </Box>
        )}

        <MaUTable ref={tableRef} size="small" className="tableWrap sticky table">
          <TableHead
            style={{
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            className="header sticky top-0 z-[11] bg-[var(--dark-primary,_white)]"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="tr sticky top-0 z-[11] bg-[var(--dark-primary,_white)]" key={headerGroup.id}>
                <SortableContext items={headerGroup.headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map((header) => {
                    if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                    return (
                      <DraggableHeader
                        virtualization={virtualization}
                        table={table}
                        customFilters={customFilters}
                        dispatch={dispatch}
                        isClientSideGrid={isClientSideGrid}
                        header={header}
                        key={header.id}
                        resource={resource}
                        virtualTable={false}
                      />
                    );
                  })}
                </SortableContext>
              </TableRow>
            ))}
          </TableHead>
          <TableBody
            style={{
              overflow: 'hidden'
            }}
            className={`body relative ${isClientSideGrid && footerRowFound ? 'with-footer' : ''}`}
          >
            <NormalTableBody
              onRowClick={onRowClick}
              rows={rows}
              virtualization={virtualization}
              state={state}
              setWholeRowsCellColor={setWholeRowsCellColor}
              table={table}
              dispatch={dispatch}
              setCellValue={setCellValue}
              submitInput={submitInput}
              cellValue={cellValue}
              resetField={resetField}
              exportTableView={exportTableView}
              excludedColumns={excludedColumns}
            />
          </TableBody>
          {isFooterVisible && (
            <>
              <tfoot className="sticky bottom-0">
                {table?.getFooterGroups().map((footerGroup) => {
                  return (
                    <tr key={footerGroup.id}>
                      {footerGroup.headers.map((header, index) => {
                        if (!header) return null;
                        if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                        const columnDef = header.column.columnDef as TColType;

                        const { style } = getStickyPosition(columnDef, index, table);

                        const colSize = header.getSize();
                        return (
                          <th
                            className={`sticky bottom-0 bg-[var(--dark-primary,_white)]`}
                            style={{
                              ...style,
                              position: 'sticky',
                              zIndex: columnDef.sticky === 'left' || columnDef.sticky === 'right' ? '15' : '1',
                              minWidth: colSize,
                              maxWidth: colSize
                            }}
                            key={header.id}
                          >
                            {header?.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </tfoot>
            </>
          )}
        </MaUTable>
      </div>
    </>
  );
});

const NormalTableBody = ({
  onRowClick,
  rows,
  virtualization,
  state,
  setWholeRowsCellColor,
  table,
  dispatch,
  setCellValue,
  submitInput,
  cellValue,
  resetField,
  exportTableView,
  excludedColumns
}) => {
  return (
    <>
      {rows.map((row) => {
        if (!row) return null;
        return (
          <TableRow key={row?.id} className={`tr`} onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}>
            {row.getVisibleCells().map((cell, index) => {
              if (exportTableView && excludedColumns.includes(cell.column.columnDef.id)) return null;
              return (
                <React.Fragment key={cell.id}>
                  <CellRenderer
                    key={cell.id}
                    virtualStyles={{}}
                    virtualization={virtualization}
                    state={state}
                    cell={cell}
                    setWholeRowsCellColor={setWholeRowsCellColor}
                    row={row}
                    index={index}
                    table={table}
                    dispatch={dispatch}
                    setCellValue={setCellValue}
                    submitInput={submitInput}
                    cellValue={cellValue}
                    resetField={resetField}
                    virtualTable={false}
                  />
                </React.Fragment>
              );
            })}
          </TableRow>
        );
      })}
    </>
  );
};
