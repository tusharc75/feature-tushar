import { Error } from '@mui/icons-material';
import { Box, CircularProgress } from '@mui/material';
import MaUTable from '@mui/material/Table';
import { Column, flexRender } from '@tanstack/react-table';
import { defaultRangeExtractor, Range, useVirtualizer } from '@tanstack/react-virtual';
import React, { ForwardedRef, forwardRef, Fragment, useEffect, useState } from 'react';
import { RnderTableProps } from 'src/components/CustomReactTable/TableComponents/Table';
import { VirtualTableBody } from 'src/components/CustomReactTable/TableComponents/VirtualTable/Body';
import { VirtualTableHead } from 'src/components/CustomReactTable/TableComponents/VirtualTable/Head';
import { getStickyPosition } from 'src/components/CustomReactTable/utils';
import { TColType } from '../TableHelperComponents';
import { cn } from 'src/constants/helpers';

const VirtualTableImpl = forwardRef(function (
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
    customContent = () => null,
    renderedFrom = ''
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
  const [parentRef, setParentRef] = useState<HTMLDivElement>(null);

  const columnVirtualizer = useVirtualizer({
    count: columns?.length || 1,
    estimateSize: (index) => sizes[index] || 200,
    getScrollElement: () => parentRef,
    horizontal: true,
    overscan: 2,
    rangeExtractor: React.useCallback(
      (range: Range, ...rest) => {
        return [...new Set([...stickyColumns.leftIndexes, ...defaultRangeExtractor(range), ...stickyColumns.rightIndexes])];
      },
      [stickyColumns.leftIndexes, stickyColumns.rightIndexes]
    )
  });

  useEffect(() => {
    columnVirtualizer.measure();
  }, [columns.length, sizes]);

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalColumnSize = columnVirtualizer.getTotalSize();

  return (
    <>
      <div
        style={{
          display: 'block',
          overflow: loading ? 'hidden' : 'auto',
          maxHeight: height ?? '100%',
          height: isFooterVisible && !pagination ? 'unset' : height || '100%',

          contain: 'paint',
          willChange: 'transform'
        }}
        className="isolate z-10 border bg-[var(--dark-primary,_white)] max-[900px]:min-h-[500px]"
        ref={setParentRef}
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

        <MaUTable ref={tableRef} size="small" className="tableWrap sticky table" style={{ width: `max(${totalColumnSize}px, 100%)` }}>
          <VirtualTableHead
            table={table}
            virtualColumns={virtualColumns}
            virtualization={virtualization}
            customFilters={customFilters}
            dispatch={dispatch}
            isClientSideGrid={isClientSideGrid}
            resource={resource}
            vtableData={vtableData}
            renderedFrom={renderedFrom}
            tableHeight={height}
          />

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
            virtualColumns={virtualColumns}
            vtableData={vtableData}
            parentRef={parentRef}
            isClientSideGrid={isClientSideGrid}
            footerRowFound={footerRowFound}
            expanderWithCustomContent={expanderWithCustomContent}
            customContentHeight={customContentHeight}
            customContent={customContent}
          />
          {isFooterVisible && (
            <>
              <tfoot className="sticky bottom-0">
                {table?.getFooterGroups().map((footerGroup) => {
                  return (
                    <tr key={footerGroup.id} className="!flex ">
                      {virtualColumns.map((vc) => {
                        const header = footerGroup.headers[vc?.index];
                        if (!header) return null;
                        if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                        const columnDef = header.column.columnDef as TColType;
                        const { style } = vtableData && vtableData[vc.index] ? vtableData[vc.index] : getStickyPosition(columnDef, vc.index, table);
                        const colSize = header.getSize();
                        return (
                          <Fragment key={vc.index}>
                            <th
                              className={cn(` max-h-[43px] bg-[var(--dark-primary,_white)] text-[13px]`)}
                              style={{
                                ...style,
                                ...(style.position === 'sticky' ? { ...style } : { ...style, position: 'absolute', left: vc.start }),
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
                          </Fragment>
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

export const VirtualTable = React.memo(VirtualTableImpl);
