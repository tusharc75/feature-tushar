import { AutoSizer, ScrollSync } from 'react-virtualized';
import { RnderTableProps } from 'src/components/CustomReactTable/TableComponents/Table';
import Body from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/Body';
import Footer from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/Footer';
import Sticky from 'src/components/CustomReactTable/TableComponents/VirtualTableWithReactVirtual/Sticky';
import { getStickyColumnNamesFromTableColumns } from 'src/components/CustomReactTable/utils';
import scrollbarSize from 'dom-helpers/scrollbarSize';

const rowHeight = 45;
const headerHeight = 45;
const footerHeight = 45;
const overscanColumnCount = 3;
const overscanRowCount = 6;

const VirtualTableWithReactVirtual = ({
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
  virtualization = false,
  onRowClick,
  resource,
  isFooterVisible,
  rows,
  initialDataLoaded,
  customFilters,
  tableData = {
    sizes: {
      left: [],
      normal: [],
      right: []
    },
    headers: {
      left: [],
      normal: [],
      right: []
    },
    columnIndexes: {
      left: [],
      normal: [],
      right: []
    },
    footerData: {
      left: [],
      normal: [],
      right: []
    },
    leftTotlaSize: 0,
    rightTotalSize: 0
  }
}: RnderTableProps & { tableData: ReturnType<typeof getStickyColumnNamesFromTableColumns> }) => {
  return (
    <div style={{ height }} className="v-table-container relative border">
      <AutoSizer>
        {({ width, height }) => (
          <ScrollSync>
            {({ clientHeight, clientWidth, onScroll, scrollHeight, scrollLeft, scrollTop, scrollWidth }) => {
              return (
                <div>
                  {tableData.columnIndexes.left.length > 0 && (
                    <Sticky
                      onRowClick={onRowClick}
                      headers={tableData.headers.left}
                      width={tableData.leftTotlaSize || 100}
                      height={isFooterVisible ? height - footerHeight : height}
                      mode="left"
                      rows={rows}
                      rowHeight={rowHeight}
                      scrollTop={scrollTop}
                      sizes={tableData.sizes?.left || []}
                      customFilters={customFilters}
                      dispatch={dispatch}
                      isClientSideGrid={isClientSideGrid}
                      resource={resource}
                      table={table}
                      virtualization={virtualization}
                      state={state}
                      setWholeRowsCellColor={setWholeRowsCellColor}
                      setCellValue={setCellValue}
                      submitInput={submitInput}
                      cellValue={cellValue}
                      resetField={resetField}
                      columnIndexes={tableData.columnIndexes.left}
                      headerHeight={headerHeight}
                      overscanColumnCount={overscanColumnCount}
                      overscanRowCount={overscanRowCount}
                    />
                  )}
                  <div className="absolute" style={{ left: tableData.leftTotlaSize }}>
                    <Body
                      onRowClick={onRowClick}
                      loading={loading}
                      error={error}
                      initialDataLoaded={initialDataLoaded}
                      headers={tableData.headers.normal}
                      height={isFooterVisible ? height - (footerHeight + scrollbarSize()) : height}
                      rowHeight={rowHeight}
                      width={width - (tableData.leftTotlaSize + tableData.rightTotalSize)}
                      onScroll={onScroll}
                      rows={rows}
                      scrollLeft={scrollLeft}
                      sizes={tableData.sizes?.normal || []}
                      customFilters={customFilters}
                      dispatch={dispatch}
                      isClientSideGrid={isClientSideGrid}
                      resource={resource}
                      table={table}
                      virtualization={virtualization}
                      state={state}
                      setWholeRowsCellColor={setWholeRowsCellColor}
                      setCellValue={setCellValue}
                      submitInput={submitInput}
                      cellValue={cellValue}
                      resetField={resetField}
                      columnIndexes={tableData.columnIndexes.normal}
                      headerHeight={headerHeight}
                      overscanColumnCount={overscanColumnCount}
                      overscanRowCount={overscanRowCount}
                    />
                  </div>
                  {tableData.columnIndexes.right.length > 0 && (
                    <Sticky
                      onRowClick={onRowClick}
                      headers={tableData.headers.right}
                      width={tableData.rightTotalSize || 100}
                      height={isFooterVisible ? height - footerHeight : height}
                      rowHeight={rowHeight}
                      mode="right"
                      rows={rows}
                      scrollTop={scrollTop}
                      sizes={tableData.sizes?.right || []}
                      customFilters={customFilters}
                      dispatch={dispatch}
                      isClientSideGrid={isClientSideGrid}
                      resource={resource}
                      table={table}
                      virtualization={virtualization}
                      state={state}
                      setWholeRowsCellColor={setWholeRowsCellColor}
                      setCellValue={setCellValue}
                      submitInput={submitInput}
                      cellValue={cellValue}
                      resetField={resetField}
                      columnIndexes={tableData.columnIndexes.right}
                      headerHeight={headerHeight}
                      overscanColumnCount={overscanColumnCount}
                      overscanRowCount={overscanRowCount}
                    />
                  )}
                  {isFooterVisible && (
                    <Footer
                      footers={tableData.footerData}
                      height={footerHeight}
                      leftTotlaSize={tableData.leftTotlaSize}
                      rightTotalSize={tableData.rightTotalSize}
                      onScroll={onScroll}
                      overscanColumnCount={overscanColumnCount}
                      rowHeight={footerHeight}
                      scrollLeft={scrollLeft}
                      sizes={tableData.sizes}
                      width={width}
                    />
                  )}
                </div>
              );
            }}
          </ScrollSync>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualTableWithReactVirtual;
