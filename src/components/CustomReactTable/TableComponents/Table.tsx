import React, { Dispatch, memo, useEffect, useMemo } from 'react';
import { Box, CircularProgress, TableBody, TableHead, TableRow } from '@material-ui/core';
import { CellRenderer, DraggableHeader, TColType } from './TableHelperComponents';
import MaUTable from '@material-ui/core/Table';
import { TActios, TInitialState } from '../hooks/useTableReducer';
import { Row, Table, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Error } from '@material-ui/icons';
import { getStickyPosition } from '../utils';

const MemoizedCellRenderer = memo(CellRenderer);

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
  reorder: (draggedColumnId: string, targetColumnId: string, columnOrder: string[]) => string[];
  loading: boolean;
  error: boolean;
  height?: any;
  virtualization: boolean;
};

const TableComponent = ({
  state,
  setWholeRowsCellColor,
  table,
  dispatch,
  setCellValue,
  submitInput,
  cellValue,
  resetField,
  isClientSideGrid,
  reorder,
  loading,
  error,
  height,
  virtualization = false
}: TTableProps) => {
  const { filters: customFilters, initialDataLoaded }: TInitialState = state;
  const columns = table.getAllColumns();
  const { columnVisibility } = table.getState();

  const visibleColumns = useMemo(() => {
    return columns.filter((column) => columnVisibility[column.id]);
  }, [columnVisibility, columns]);

  const { rows } = table.getRowModel();

  // virtualization
  const parentRef = React.useRef();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => 45,
    overscan: 3
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => visibleColumns[i].getSize(),
    overscan: 3
  });

  useEffect(() => {
    if (virtualization) rowVirtualizer.measure();
  }, [rowVirtualizer, rows.length, virtualization]);

  useEffect(() => {
    if (virtualization) columnVirtualizer.measure();
  }, [columnVirtualizer, visibleColumns.length, virtualization]);

  const VirtualTable = () => {
    return (
      <>
        {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
          const row = rows[virtualRow.index] as Row<any>;
          return (
            <TableRow
              key={row.id}
              className={`tr  d-flex`}
              style={{
                maxHeight: `${virtualRow.size}px`,
                height: `${virtualRow.size}px`,
                position: 'absolute',
                width: '100%',
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {columnVirtualizer.getVirtualItems().map((virtualCell, index) => {
                const cell = row.getVisibleCells()[virtualCell.index];
                return (
                  <MemoizedCellRenderer
                    key={cell.id}
                    virtualStyles={{
                      position: 'absolute',
                      top: 0,
                      left: `${virtualCell.start}px`,
                      width: `${virtualCell.size}px`,
                      height: `${virtualRow.size}px`
                      // transform: `translateX(${virtualCell.start}px) translateY(${virtualRow.start}px)`
                    }}
                    {...{
                      virtualization,
                      state,
                      cell,
                      setWholeRowsCellColor,
                      row,
                      index,
                      table,
                      dispatch,
                      setCellValue,
                      submitInput,
                      cellValue,
                      resetField
                    }}
                  />
                );
              })}
            </TableRow>
          );
        })}
      </>
    );
  };

  const NormalTable = () => {
    return (
      <>
        {rows.map((row) => {
          return (
            <TableRow key={row.id} className={`tr`}>
              {row.getVisibleCells().map((cell, index) => {
                return (
                  <MemoizedCellRenderer
                    key={cell.id}
                    virtualStyles={{}}
                    {...{
                      virtualization,
                      state,
                      cell,
                      setWholeRowsCellColor,
                      row,
                      index,
                      table,
                      dispatch,
                      setCellValue,
                      submitInput,
                      cellValue,
                      resetField
                    }}
                  />
                );
              })}
            </TableRow>
          );
        })}
      </>
    );
  };

  const styles = useMemo(
    () => (virtualization ? { width: `${columnVirtualizer.getTotalSize()}px`, height: `${rowVirtualizer.getTotalSize()}px` } : {}),
    [virtualization, columnVirtualizer, rowVirtualizer]
  );

  // const footers;

  const footerRowFound = useMemo(() => {
    const found = table?.getFooterGroups()[0].headers.some((h) => h.column.columnDef.footer);
    return found;
  }, [table]);

  return (
    <>
      <div
        style={{
          display: 'block',
          overflow: loading ? 'hidden' : 'auto',
          height: height ?? '100%'
        }}
        className="border z-10 bg-[var(--dark-primary,_white)] isolate max-[768px]:min-h-[500px]"
        ref={virtualization ? parentRef : undefined}
      >
        {!loading && !error && rows.length === 0 && initialDataLoaded && (
          <>
            <Box className=" w-fit h-fit absolute m-auto inset-0 top-[46px] flex justify-center items-center -z-10 select-none">
              <div className=" px-10 py-5 rounded-lg text-center">
                <p>No data found</p>
              </div>
            </Box>
          </>
        )}
        {(loading || error || !initialDataLoaded) && (
          <Box className="bg-[rgba(255,255,255,0.2)] dark:bg-[rgba(0,0,0,0.1)] w-full h-full z-50 absolute inset-0 flex justify-center items-center">
            <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg text-center shadow-md">
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

        <MaUTable size="small" className="tableWrap table sticky" style={styles}>
          <TableHead
            style={{
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            className="header sticky top-0 bg-[var(--dark-primary,_white)] z-[11]"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="tr sticky top-0 bg-[var(--dark-primary,_white)] z-[11] " key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <DraggableHeader
                      virtualization={virtualization}
                      table={table}
                      customFilters={customFilters}
                      dispatch={dispatch}
                      isClientSideGrid={isClientSideGrid}
                      reorder={reorder}
                      header={header}
                      key={header.id}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody
            style={{
              overflow: 'hidden'
            }}
            className={`body relative ${isClientSideGrid && footerRowFound ? 'with-footer' : ''}`}
          >
            {virtualization ? <VirtualTable /> : <NormalTable />}
          </TableBody>
          {isClientSideGrid && footerRowFound && table.getRowModel().rows.length > 0 && (
            <>
              <tfoot>
                {table?.getFooterGroups().map((footerGroup) => {
                  return (
                    <tr key={footerGroup.id}>
                      {footerGroup.headers.map((header, index) => {
                        const columnDef = header.column.columnDef as TColType;
                        const { style } = getStickyPosition(columnDef, index, table);
                        const colSize = header.getSize();
                        return (
                          <th
                            className={`bg-[var(--dark-primary,_white)] sticky bottom-0`}
                            style={{
                              ...style,
                              position: 'sticky',
                              zIndex: columnDef.sticky === 'left' || columnDef.sticky === 'right' ? 12 : 'unset',
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
};

export default TableComponent;
