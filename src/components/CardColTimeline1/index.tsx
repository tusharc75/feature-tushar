import React, { useMemo } from 'react';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import styles from './index.module.scss';
import { Box, Typography, Grid } from '@material-ui/core';
import RenderColumns from './RenderColumns';
import { BoxProps } from '@material-ui/core';
import { TInitialState, TActios } from './hooks/useCardReducer';

export * from './hooks/useCardReducer';

interface CardColInterface extends BoxProps {
  cardOnClick?: (e: React.MouseEvent, data: any) => void;
  passFailStatus?: boolean;
  passFailAccessor?: string;
  cardHeight?: number;
  isCreateNew?: boolean;
  createNew?: () => void;
  createNewText?: string;
  state: TInitialState;
  dispatch: React.Dispatch<TActios>;
  fetchSingleColumn: (column: string, page: number, appendData?: boolean, filterQuery?: string) => void;
}

export type datarowInterface = TDate | TDateTime | TText | TTimer | TLink | TTitle | TLinkTitle;

type TCommon = {
  accessor: string;
  title?: string;
  // type: 'date' | 'dateTime' | 'text' | 'timer' | 'link' | 'title' | 'linkTitle';
  renderer?: (data: any) => string;
};

type TDate = TCommon & {
  type: 'date';
};
type TDateTime = TCommon & {
  type: 'dateTime';
};
type TText = TCommon & {
  type: 'text';
};
type TTimer = TCommon & {
  type: 'timer';
};
type TLink = TCommon & {
  type: 'link';
  link: (data: any) => string;
};
type TTitle = TCommon & {
  type: 'title';
};
type TLinkTitle = TCommon & {
  type: 'linkTitle';
  link: (data: any) => string;
};

const HEADER_HEIGHT = 90;
const ROW_HEIGHT = 20;

const calcCardHeight = (rowDef: datarowInterface[]) => {
  const head = rowDef?.find((c) => c.type === 'title' || c.type === 'linkTitle');
  if (!head) return ROW_HEIGHT * rowDef.length;
  return HEADER_HEIGHT + (rowDef.length - 1) * ROW_HEIGHT;
};

const CardColTimeline: React.FC<CardColInterface> = ({
  cardOnClick = null,
  passFailStatus = true,
  passFailAccessor = 'passfail',
  className = '',
  cardHeight,
  createNew,
  createNewText,
  isCreateNew,
  state,
  dispatch,
  fetchSingleColumn,
  ...others
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = React.useState(600);

  const { data, count, loading, page, columnOrder, visibleColumns, filterQuery, rowDef } = state;

  const cardCalculatedHeight = cardHeight ?? calcCardHeight(rowDef);

  // sort columns
  const columns = useMemo(() => {
    const sortedCols = [...visibleColumns].sort((a, b) => {
      return columnOrder.indexOf(a) - columnOrder.indexOf(b);
    });
    return sortedCols;
  }, [columnOrder, visibleColumns]);

  React.useLayoutEffect(() => {
    if (containerRef.current) setContainerHeight(containerRef.current.clientHeight - 125);
  }, [containerRef]);

  return (
    <div className={`${styles.container} ${className}`} {...others} ref={containerRef}>
      <div className="py-4 flex  gap-[10px] md:scroll-px-[24px] overflow-auto snap-mandatory snap-x">
        {columns.map((col) => {
          return (
            <div
              key={col}
              className={`${styles.singleCol} snap-start min-w-[min(100%,350px)] max-w-[350px]`}
              style={
                {
                  '--bg': col === 'Pending' ? '#F8A300' : col === 'In-Progress' ? '#F16A9A' : col === 'Completed' ? '#31AC1D' : '#7F76EB',
                  '--border': col === 'Completed' ? '#F1FEED' : col === 'In-Progress' ? '#FFF3FA' : '#FFFEEF',
                  '--color': col === 'Completed' ? '#31AC1D' : col === 'In-Progress' ? '#F16A9A' : '#F8A300'
                } as React.CSSProperties
              }
            >
              <div className="bg-[var(--section-bg)] px-[6px] pb-[10px] pt-[0px] rounded-[8px] min-h-full">
                <Typography className={styles.colTitle}>
                  <span></span>
                  {col} ({count[col] || 0})
                </Typography>
                <RenderColumns
                  column={col}
                  cardOnClick={cardOnClick}
                  passFailStatus={passFailStatus}
                  passFailAccessor={passFailAccessor}
                  cardHeight={cardCalculatedHeight}
                  isCreateNew={isCreateNew}
                  createNew={createNew}
                  createNewText={createNewText}
                  containerHeight={containerHeight}
                  state={state}
                  dispatch={dispatch}
                  fetchSingleColumn={fetchSingleColumn}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardColTimeline;

interface groupByinterface {
  objectArray: any[];
  property: string;
  sortBy?: string[];
  columnsToKeep?: string[];
}

export function groupBy({ objectArray, property, sortBy = null, columnsToKeep = null }: groupByinterface) {
  const newObj = objectArray.reduce((acc, obj) => {
    const key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(obj);
    return acc;
  }, {});

  let newObjkeys = Object.keys(newObj);
  if (columnsToKeep) {
    if (newObjkeys.length !== columnsToKeep.length) {
      columnsToKeep.forEach((col) => {
        const keyFound = newObjkeys.includes(col) ? null : col;
        if (keyFound) {
          newObj[keyFound] = [];
        }
      });
    }
    newObjkeys = Object.keys(newObj);
  }

  let sortedObj: any = newObjkeys;
  if (sortBy) {
    sortedObj = {};
    sortBy.forEach((col) => {
      if (newObjkeys.includes(col)) {
        sortedObj[col] = newObj[col];
      }
    });
  }

  return sortedObj;
}
