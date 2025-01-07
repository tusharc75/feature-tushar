import { Box, CircularProgress, TableBody } from '@mui/material';
import MaUTable from '@mui/material/Table';
import { Error } from '@mui/icons-material';
import { Column, flexRender } from '@tanstack/react-table';
import { defaultRangeExtractor, Range, useVirtualizer } from '@tanstack/react-virtual';
import React, { ForwardedRef, forwardRef, Fragment, useEffect } from 'react';
import { RnderTableProps } from 'src/components/CustomReactTable/TableComponents/Table';
import { VirtualTableBody } from 'src/components/CustomReactTable/TableComponents/VirtualTable/Body';
import { VirtualTableHead } from 'src/components/CustomReactTable/TableComponents/VirtualTable/Head';
import { TColType } from '../TableHelperComponents';
import { getStickyPosition } from 'src/components/CustomReactTable/utils';

let virtualPaddingLeft: number | undefined;
let virtualPaddingRight: number | undefined;

export const VirtualTable = forwardRef(function (
  {
    columns,
    sizes,
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
    stickyColumns,
    handleChangeCurrentEditingCellPosition,
    vtableData,
    expanderWithCustomContent = false,
    customContentHeight = 300,
    customContent = () => null
  }: RnderTableProps & {
    columns: Column<any, unknown>[];
    sizes: number[];
    handleChangeCurrentEditingCellPosition: (rowId: string, colId: string) => void;
    vtableData: any[];
    expanderWithCustomContent: boolean;
    customContentHeight: number;
    customContent: ({ row }: { row: any }) => React.ReactNode;
  },
  ref: ForwardedRef<HTMLTableElement>
) {
  const parentRef = React.useRef();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 2,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined
  });

  const columnVirtualizer = useVirtualizer({
    count: columns?.length || 1,
    estimateSize: (index) => sizes[index] || 200,
    getScrollElement: () => parentRef.current,
    horizontal: true,
    overscan: 3,
    rangeExtractor: React.useCallback(
      (range: Range, ...rest) => {
        const next = new Set([...defaultRangeExtractor(range), ...stickyColumns.stickyIndexes]);
        return [...next].sort((a, b) => a - b);
      },
      [stickyColumns.stickyIndexes]
    )
  });

  useEffect(() => {
    columnVirtualizer.measure();
  }, [columns.length]);

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rows.length]);

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const virtualrows = rowVirtualizer.getVirtualItems();
  const { leftIndexes: stickyLeft, rightIndexes: stickyRight, right, left } = stickyColumns;

  const totalColumnSize = columnVirtualizer.getTotalSize();

  if (columnVirtualizer && virtualColumns?.length) {
    let leftIndex = 0;
    // check to see if the window passed the left sticky columns then move the left index to the first nonsticky index
    if (virtualColumns[stickyLeft.length]?.index !== stickyLeft[stickyLeft.length - 1] + 1) {
      leftIndex = stickyLeft.length;
    }
    virtualPaddingLeft = virtualColumns[leftIndex]?.start ?? 0;

    let rightIndex = virtualColumns.length - 1;
    if (virtualColumns[rightIndex - stickyRight.length]?.index !== stickyRight[0] - 1) {
      rightIndex = virtualColumns.length - 1 - stickyRight.length;
    }

    virtualPaddingRight = totalColumnSize - (virtualColumns[rightIndex] ? virtualColumns[rightIndex]?.end : totalColumnSize);
  }

  return (
    <>
      <div
        style={{
          display: 'block',
          overflow: loading ? 'hidden' : 'auto',
          maxHeight: height ?? '100%',
          height: isFooterVisible && !pagination ? 'unset' : height || '100%'
        }}
        className="isolate z-10 overscroll-contain border bg-[var(--dark-primary,_white)] max-[900px]:min-h-[500px]"
        ref={parentRef}
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
        <div aria-describedby="table-container">
          <MaUTable ref={tableRef} size="small" className="tableWrap table" style={{ width: `max(${totalColumnSize}px, 100%)` }}>
            <VirtualTableHead
              table={table}
              virtualColumns={virtualColumns}
              right={right}
              left={left}
              virtualization={virtualization}
              customFilters={customFilters}
              dispatch={dispatch}
              isClientSideGrid={isClientSideGrid}
              resource={resource}
              vtableData={vtableData}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
            />
            <TableBody
              style={{
                overflow: 'hidden',
                height: `${rowVirtualizer.getTotalSize()}px`
              }}
              className={`body relative ${isClientSideGrid && footerRowFound ? 'with-footer' : ''}`}
            >
              <VirtualTableBody
                onRowClick={onRowClick}
                rows={rows}
                virtualization={virtualization}
                state={state}
                setWholeRowsCellColor={setWholeRowsCellColor}
                table={table}
                handleChangeCurrentEditingCellPosition={handleChangeCurrentEditingCellPosition}
                setCellValue={setCellValue}
                submitInput={submitInput}
                cellValue={cellValue}
                resetField={resetField}
                virtualrows={virtualrows}
                virtualColumns={virtualColumns}
                right={right}
                left={left}
                vtableData={vtableData}
                virtualPaddingLeft={virtualPaddingLeft}
                virtualPaddingRight={virtualPaddingRight}
                rowVirtualizer={rowVirtualizer}
                expanderWithCustomContent={expanderWithCustomContent}
                customContentHeight={customContentHeight}
                customContent={customContent}
              />
            </TableBody>
            {isFooterVisible && (
              <>
                <tfoot className={'sticky bottom-0 block'} style={{ position: 'sticky', bottom: '0px' }}>
                  {table?.getFooterGroups().map((footerGroup) => {
                    return (
                      <tr key={footerGroup.id} className="!flex ">
                        {virtualPaddingLeft && left.length === 0 ? (
                          <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} />
                        ) : null}
                        {virtualColumns.map((vc) => {
                          const header = footerGroup.headers[vc?.index];
                          if (!header) return null;
                          if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                          const columnDef = header.column.columnDef as TColType;
                          const { style } = vtableData && vtableData[vc.index] ? vtableData[vc.index] : getStickyPosition(columnDef, vc.index, table);
                          const colSize = header.getSize();
                          return (
                            <Fragment key={vc.index}>
                              {right.length && header.id === right[0] && virtualPaddingRight ? (
                                <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} />
                              ) : null}
                              <th
                                className={`bg-[var(--dark-primary,_white)] text-[13px]`}
                                style={{
                                  ...style,
                                  position: 'sticky',
                                  zIndex: columnDef.sticky === 'left' || columnDef.sticky === 'right' ? 12 : 'unset',
                                  minWidth: colSize,
                                  maxWidth: colSize,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                key={header.id}
                              >
                                {header?.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                              </th>
                              {left.length && header.id === left[left.length - 1] && virtualPaddingLeft ? (
                                <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} />
                              ) : null}
                            </Fragment>
                          );
                        })}
                        {virtualPaddingRight && right.length === 0 ? (
                          <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} />
                        ) : null}
                      </tr>
                    );
                  })}
                </tfoot>
              </>
            )}
          </MaUTable>
        </div>
      </div>
    </>
  );
});
