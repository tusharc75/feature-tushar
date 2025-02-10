import { Collapse } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Fragment, memo, useEffect } from 'react';
import { CellRenderer } from '../TableHelperComponents';

export const VirtualTableBody = memo(
  ({
    onRowClick,
    rows,
    virtualization,
    state,
    setWholeRowsCellColor,
    table,
    handleChangeCurrentEditingCellPosition,
    setCellValue,
    submitInput,
    cellValue,
    resetField,
    virtualColumns,
    vtableData,
    virtualPaddingRight,
    virtualPaddingLeft,
    expanderWithCustomContent = false,
    customContentHeight = 300,
    customContent: CustomContent = null,
    isClientSideGrid,
    parentRef,
    footerRowFound
  }: any) => {
    const { customExpanderRowData } = state;

    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef,
      estimateSize: () => 45,
      overscan: 2,
      measureElement:
        typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
          ? (element) => element?.getBoundingClientRect().height
          : undefined
    });

    const virtualRows = rowVirtualizer.getVirtualItems();

    useEffect(() => {
      rowVirtualizer.measure();
    }, [rows.length]);

    return (
      <>
        <tbody
          style={{
            display: 'block',
            height: `${rowVirtualizer.getTotalSize()}px`
          }}
          className={`body relative ${isClientSideGrid && footerRowFound ? 'with-footer' : ''}`}
        >
          {virtualRows.map((virtualRow, index) => {
            const row = rows[virtualRow.index];
            const visibleCells = row?.getVisibleCells();
            if (!row) return null;
            const isExpanded = customExpanderRowData?.[row?.id] || (customExpanderRowData && customExpanderRowData === 'all');
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="tr"
                style={{ transform: `translateY(${virtualRow.start}px)`, position: 'absolute', willChange: 'transform', width: '100%' }}
              >
                <MemoizedSingleRow
                  virtualColumns={virtualColumns}
                  virtualization={virtualization}
                  state={state}
                  setWholeRowsCellColor={setWholeRowsCellColor}
                  row={row}
                  table={table}
                  handleChangeCurrentEditingCellPosition={handleChangeCurrentEditingCellPosition}
                  setCellValue={setCellValue}
                  submitInput={submitInput}
                  cellValue={cellValue}
                  resetField={resetField}
                  visibleCells={visibleCells}
                  vtableData={vtableData}
                  virtualPaddingRight={virtualPaddingRight}
                  virtualPaddingLeft={virtualPaddingLeft}
                  virtualRow={virtualRow}
                  onRowClick={onRowClick}
                />
                {expanderWithCustomContent && CustomContent ? (
                  <Collapse
                    in={isExpanded}
                    unmountOnExit
                    className="custom-content relative max-w-full overflow-auto  overscroll-contain border-b bg-gray-100 dark:bg-gray-700"
                  >
                    <div style={{ height: customContentHeight, maxWidth: parentRef.clientWidth }} className=" sticky left-0 py-4 pl-[70px] pr-4">
                      {isExpanded && <CustomContent row={row.original} height={customContentHeight - 32} />}
                    </div>
                  </Collapse>
                ) : null}
              </div>
            );
          })}
        </tbody>
      </>
    );
  }
);

const MemoizedCellRenderer = memo(CellRenderer);

export const MemoizedSingleRow = memo(
  ({
    virtualColumns,
    state,
    setWholeRowsCellColor,
    row,
    table,
    handleChangeCurrentEditingCellPosition,
    setCellValue,
    submitInput,
    cellValue,
    resetField,
    visibleCells,
    vtableData,
    virtualRow,
    onRowClick
  }: any) => {
    return (
      <tr
        key={virtualRow.index}
        style={{
          display: 'flex'
        }}
        className={`tr`}
        onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}
      >
        <>
          {virtualColumns.map((virtualCell) => {
            const cell = visibleCells?.[virtualCell?.index];

            if (!cell) return null;
            return (
              <Fragment key={virtualColumns.index}>
                <MemoizedCellRenderer
                  key={virtualColumns.index}
                  virtualStyles={{ position: 'absolute', transform: `translateX(${virtualCell.start}px)`, willChange: 'transform' }}
                  state={state}
                  cell={cell}
                  setWholeRowsCellColor={setWholeRowsCellColor}
                  row={row}
                  index={virtualCell.index}
                  table={table}
                  handleChangeCurrentEditingCellPosition={handleChangeCurrentEditingCellPosition}
                  setCellValue={setCellValue}
                  submitInput={submitInput}
                  cellValue={cellValue}
                  resetField={resetField}
                  vtableData={vtableData}
                />
              </Fragment>
            );
          })}
        </>
      </tr>
    );
  }
  // (prev, next) => prev.row === next.row && prev.virtualColumns === next.virtualColumns
);
