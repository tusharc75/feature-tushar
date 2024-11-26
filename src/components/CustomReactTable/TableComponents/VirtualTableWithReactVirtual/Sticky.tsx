import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Header, Column as TColumn } from '@tanstack/react-table';
import scrollbarSize from 'dom-helpers/scrollbarSize';
import { useEffect, useRef } from 'react';
import { Grid } from 'react-virtualized';
import RenderBody from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/RenderBody';
import RenderHeader from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/RenderHeader';

const Sticky = ({
  sizes,
  scrollTop,
  rows,
  width,
  mode,
  rowHeight,
  height,
  columns,
  dispatch,
  table,
  resource,
  customFilters,
  isClientSideGrid,
  headers,
  columnIndexes,
  virtualization,
  state,
  setWholeRowsCellColor,
  setCellValue,
  submitInput,
  cellValue,
  resetField,
  headerHeight,
  overscanColumnCount,
  overscanRowCount,
  onRowClick
}: {
  sizes: number[];
  scrollTop: number;
  rowHeight: number;
  rows: any[];
  width: number;
  mode: 'left' | 'right';
  height: number;
  columns: TColumn<any, unknown>[];
  headers: Header<any, unknown>[];
  dispatch: any;
  table: any;
  resource: string;
  customFilters: any;
  isClientSideGrid: boolean;
  columnIndexes: number[];
  virtualization: any;
  state: any;
  setWholeRowsCellColor: any;
  setCellValue: any;
  submitInput: any;
  cellValue: any;
  resetField: any;
  headerHeight: number;
  overscanColumnCount: number;
  overscanRowCount: number;
  onRowClick: any;
}) => {
  const headRef = useRef<Grid>(null);
  const bodyRef = useRef<Grid>(null);

  useEffect(() => {
    headRef.current?.recomputeGridSize();
    bodyRef.current?.recomputeGridSize();
  }, [sizes]);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          [mode]: 0,
          top: 0,
          borderLeft: '1px solid var(--common-border-color)'
        }}
      >
        <SortableContext items={headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
          <Grid
            ref={headRef}
            className="!overflow-hidden focus-visible:outline-0"
            cellRenderer={({ columnIndex, isScrolling, isVisible, key, parent, rowIndex, style }) => (
              <RenderHeader
                columnIndex={columnIndex}
                key={key}
                style={style}
                rowIndex={rowIndex}
                header={headers[columnIndex]}
                isClientSideGrid={isClientSideGrid}
                dispatch={dispatch}
                resource={resource}
                customFilters={customFilters}
                table={table}
              />
            )}
            width={width}
            height={headerHeight}
            rowHeight={headerHeight}
            columnWidth={({ index }) => sizes[index]}
            rowCount={1}
            columnCount={columns.length}
          />
        </SortableContext>
      </div>
      <div
        style={{
          position: 'absolute',
          [mode]: 0,
          top: headerHeight
        }}
      >
        <Grid
          ref={bodyRef}
          className={'!overflow-hidden focus-visible:outline-0'}
          overscanColumnCount={overscanColumnCount}
          overscanRowCount={overscanRowCount}
          cellRenderer={({ columnIndex, rowIndex, key, style }) => {
            const cells = rows[rowIndex]?.getVisibleCells();
            if (!cells) return null;
            return (
              <RenderBody
                onRowClick={onRowClick}
                row={rows[rowIndex]}
                columnIndex={columnIndex}
                cell={cells[columnIndexes[columnIndex]]}
                key={key}
                style={style}
                virtualization={virtualization}
                state={state}
                setWholeRowsCellColor={setWholeRowsCellColor}
                table={table}
                dispatch={dispatch}
                setCellValue={setCellValue}
                submitInput={submitInput}
                cellValue={cellValue}
                resetField={resetField}
              />
            );
          }}
          columnWidth={({ index }) => sizes[index]}
          columnCount={columns.length}
          height={height - (headerHeight + scrollbarSize())}
          rowHeight={rowHeight}
          rowCount={rows.length}
          scrollTop={scrollTop}
          width={width}
        />
      </div>
    </>
  );
};

export default Sticky;
