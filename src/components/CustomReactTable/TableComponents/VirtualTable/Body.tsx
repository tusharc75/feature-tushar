import { Collapse, TableRow } from '@mui/material';
import { Fragment, memo } from 'react';
import { CellRenderer } from '../TableHelperComponents';

const MemoizedCellRenderer = memo(CellRenderer);

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
    virtualrows,
    virtualColumns,
    right,
    left,
    vtableData,
    virtualPaddingRight,
    virtualPaddingLeft,
    rowVirtualizer,
    expanderWithCustomContent = false,
    customContentHeight = 300,
    customContent = null
  }: any) => {
    const { customExpanderRowData } = state;
    return (
      <>
        {virtualrows.map((virtualRow, index) => {
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
              <TableRow
                key={virtualrows.index}
                style={{
                  display: 'flex'
                }}
                className={`tr`}
                onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}
              >
                <MemoizedSingleRow
                  right={right}
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
                  left={left}
                  visibleCells={visibleCells}
                  vtableData={vtableData}
                  virtualPaddingRight={virtualPaddingRight}
                  virtualPaddingLeft={virtualPaddingLeft}
                />
              </TableRow>
              {expanderWithCustomContent && customContent ? (
                <Collapse in={isExpanded} unmountOnExit>
                  <div className="custom-content pl-[70px]" style={{ height: customContentHeight }}>
                    {customContent({ row: row.original })}
                  </div>
                </Collapse>
              ) : null}
            </div>
          );
        })}
      </>
    );
  }
);

export const MemoizedSingleRow = memo(
  ({
    right,
    virtualColumns,
    virtualization,
    state,
    setWholeRowsCellColor,
    row,
    table,
    handleChangeCurrentEditingCellPosition,
    setCellValue,
    submitInput,
    cellValue,
    resetField,
    left,
    visibleCells,
    vtableData,
    virtualPaddingRight,
    virtualPaddingLeft
  }: any) => {
    return (
      <>
        {virtualPaddingLeft && left.length === 0 ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
        {virtualColumns.map((virtualCell, index) => {
          const cell = visibleCells?.[virtualCell?.index];
          if (!cell) return null;
          return (
            <Fragment key={virtualColumns.index}>
              {right.length && cell.column.id === right[0] && virtualPaddingRight ? (
                <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} />
              ) : null}
              <MemoizedCellRenderer
                key={virtualColumns.index}
                virtualStyles={{}}
                virtualization={virtualization}
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
              {left.length && cell.column.id === left[left.length - 1] && virtualPaddingLeft ? (
                <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} />
              ) : null}
            </Fragment>
          );
        })}
        {virtualPaddingRight && right.length === 0 ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} /> : null}
      </>
    );
  }
);
