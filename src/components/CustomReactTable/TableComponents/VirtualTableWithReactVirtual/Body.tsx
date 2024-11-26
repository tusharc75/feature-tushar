import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { CircularProgress } from '@material-ui/core';
import { Error } from '@material-ui/icons';
import { Header, Column as TColumn } from '@tanstack/react-table';
import scrollbarSize from 'dom-helpers/scrollbarSize';
import { memo, useEffect, useRef } from 'react';
import { Grid, OnScrollParams } from 'react-virtualized';
import { areEqual } from 'react-window';
import RenderBody from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/RenderBody';
import RenderHeader from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/RenderHeader';

const MemoIzedBody = memo(RenderBody, areEqual);
let timeout: NodeJS.Timeout;

const Body = ({
  height,
  width,
  columns,
  scrollLeft,
  sizes,
  onScroll,
  rowHeight,
  headers,
  rows,
  dispatch,
  table,
  resource,
  customFilters,
  isClientSideGrid,
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
  loading,
  error,
  initialDataLoaded,
  onRowClick
}: {
  onScroll: (params: OnScrollParams) => void;
  rows: any[];
  sizes: number[];
  rowHeight: number;
  scrollLeft: number;
  columns: TColumn<any, unknown>[];
  width: number;
  headers: Header<any, unknown>[];
  height: number;
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
  loading: boolean;
  error: any;
  initialDataLoaded: boolean;
  onRowClick?: any;
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
          top: 0,
          height: headerHeight,
          width: width - scrollbarSize()
        }}
      >
        <SortableContext items={headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
          <Grid
            ref={headRef}
            className="!overflow-hidden focus-visible:outline-0 "
            columnWidth={({ index }) => sizes[index] || 50}
            columnCount={columns.length}
            height={headerHeight}
            overscanColumnCount={overscanColumnCount}
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
            rowHeight={headerHeight}
            rowCount={1}
            scrollLeft={scrollLeft}
            width={width - scrollbarSize()}
          />
        </SortableContext>
      </div>
      <div
        style={{
          width,
          top: headerHeight
        }}
      >
        {!loading && !error && rows.length === 0 && initialDataLoaded && (
          <>
            <div className=" absolute inset-0 top-[46px] -z-10 m-auto flex h-fit w-fit select-none items-center justify-center">
              <div className=" rounded-lg px-10 py-5 text-center">
                <p>No data found</p>
              </div>
            </div>
          </>
        )}
        {(loading || error || !initialDataLoaded) && (
          <div className="absolute inset-0 z-50 flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.2)] dark:bg-[rgba(0,0,0,0.1)]">
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
          </div>
        )}

        <Grid
          columnWidth={({ index }) => sizes[index]}
          ref={bodyRef}
          className={'focus-visible:outline-0'}
          columnCount={columns.length}
          height={height - headerHeight}
          onScroll={onScroll}
          scrollLeft={scrollLeft}
          overscanColumnCount={overscanColumnCount}
          overscanRowCount={overscanRowCount}
          cellRenderer={({ columnIndex, rowIndex, key, style }) => {
            const cells = rows[rowIndex]?.getVisibleCells();
            if (!cells) return null;
            const cell = cells[columnIndexes[columnIndex]];
            if (!cell) return null;
            return (
              <MemoIzedBody
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
          rowHeight={rowHeight}
          rowCount={rows.length}
          width={width}
        />
      </div>
    </>
  );
};

export default Body;
