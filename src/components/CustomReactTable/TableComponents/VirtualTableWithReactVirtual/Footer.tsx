import { flexRender, Header } from '@tanstack/react-table';
import { useEffect, useRef } from 'react';
import { Grid, OnScrollParams } from 'react-virtualized';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const Footer = ({
  height,
  width,
  scrollLeft,
  sizes,
  onScroll,
  rowHeight,
  overscanColumnCount,
  footers,
  leftTotlaSize,
  rightTotalSize
}: {
  onScroll: (params: OnScrollParams) => void;
  rowHeight: number;
  scrollLeft: number;
  sizes: { left: number[]; normal: number[]; right: number[] };

  footers: {
    left: Header<any, unknown>[];
    normal: Header<any, unknown>[];
    right: Header<any, unknown>[];
  };
  leftTotlaSize: number;
  rightTotalSize: number;
  width: number;
  height: number;
  overscanColumnCount: number;
}) => {
  const leftRef = useRef<Grid>(null);
  const centerRef = useRef<Grid>(null);
  const rightRef = useRef<Grid>(null);

  useEffect(() => {
    leftRef.current?.recomputeGridSize();
    centerRef.current?.recomputeGridSize();
    rightRef.current?.recomputeGridSize();
  }, [sizes]);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          width,
          bottom: 0
        }}
        className="relative border"
      >
        <div style={{ position: 'absolute', width: leftTotlaSize, left: 0, bottom: 0 }} className="border">
          <Grid
            className="!overflow-hidden focus-visible:outline-0"
            columnWidth={({ index }) => sizes.left[index]}
            ref={centerRef}
            columnCount={footers.left.length}
            height={height}
            onScroll={onScroll}
            overscanColumnCount={overscanColumnCount}
            cellRenderer={({ columnIndex, style, key }) => {
              const cell = footers.left[columnIndex];
              if (!cell) return null;
              return <RenderFooter header={cell} style={style} key={key} />;
            }}
            rowHeight={rowHeight}
            rowCount={1}
            width={leftTotlaSize}
          />
        </div>
        <div style={{ position: 'absolute', width: width - (leftTotlaSize + rightTotalSize), left: leftTotlaSize, bottom: 0 }} className="border">
          <Grid
            className="!overflow-hidden"
            columnWidth={({ index }) => sizes.normal[index]}
            ref={centerRef}
            columnCount={footers.normal.length}
            height={height}
            onScroll={onScroll}
            scrollLeft={scrollLeft}
            overscanColumnCount={overscanColumnCount}
            cellRenderer={({ columnIndex, style, key }) => {
              const cell = footers.normal[columnIndex];
              if (!cell) return null;
              return <RenderFooter header={cell} style={style} key={key} />;
            }}
            rowHeight={rowHeight}
            rowCount={1}
            width={width - (leftTotlaSize + rightTotalSize)}
          />
        </div>
        <div style={{ position: 'absolute', width: rightTotalSize, right: 0, bottom: 0 }} className="border">
          <Grid
            className="!overflow-hidden focus-visible:outline-0"
            columnWidth={({ index }) => sizes.right[index]}
            ref={centerRef}
            columnCount={footers.right.length}
            height={height}
            onScroll={onScroll}
            overscanColumnCount={overscanColumnCount}
            cellRenderer={({ columnIndex, style, key }) => {
              const cell = footers.right[columnIndex];
              if (!cell) return null;
              return <RenderFooter header={cell} style={style} key={key} />;
            }}
            rowHeight={rowHeight}
            rowCount={1}
            width={rightTotalSize}
          />
        </div>
      </div>
    </>
  );
};

export default Footer;

const RenderFooter = ({ header, style }) => {
  const columnDef = header.column.columnDef as TColType;

  const colSize = header.getSize();
  return (
    <div style={style} className={`flex items-center justify-center p-[5px_8px] font-bold`}>
      <div
        className={``}
        style={{
          minWidth: colSize,
          maxWidth: colSize
        }}
        key={header.id}
      >
        {header?.isPlaceholder ? null : flexRender(columnDef.footer, header.getContext())}
      </div>
    </div>
  );
};
