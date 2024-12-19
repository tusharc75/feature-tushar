import { BoxProps, Checkbox, Typography } from '@material-ui/core';
import React, { ReactNode, useMemo } from 'react';
import RenderColumns from './RenderColumns';
import { TActios, TInitialState } from './hooks/useCardReducer';
import styles from './index.module.scss';
import { uniqBy } from 'lodash';
import { cn } from 'src/constants/helpers';

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
  assignOptions?: any;
  openAssignHandler?: (option: any, data: any) => void;
}

export type datarowInterface = TDate | TDateTime | TText | TTimer | TLink | TTitle | TLinkTitle | TTooltip;

type TCommon = {
  accessor: string;
  title?: string;
  renderer?: (data: any) => string | ReactNode | Element;
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
  target?: '_blank' | '_self' | '_parent' | '_top';
};
type TTitle = TCommon & {
  type: 'title';
  link?: (data: any) => string;
  target?: '_blank' | '_self' | '_parent' | '_top';
};
type TLinkTitle = TCommon & {
  type: 'linkTitle';
  link: (data: any) => string;
};
type TTooltip = {
  type: 'tooltip';
  accessor: string;
  renderer: (data: any) => ReactNode | Element;
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

  const { data, selectedRecords, count, columnOrder, visibleColumns } = state;

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
    <div className={cn(`${styles.container}`, className)} {...others} ref={containerRef}>
      <div className="flex snap-x snap-mandatory gap-[10px] overflow-auto pb-4 md:scroll-px-[24px]">
        {columns.map((col) => {
          return (
            <div
              key={col}
              className={`${styles.singleCol} min-w-[min(90%,350px)] max-w-[350px] snap-start`}
              style={
                {
                  '--bg': col === 'Pending' ? '#F8A300' : col === 'In-Progress' ? '#F16A9A' : col === 'Completed' ? '#31AC1D' : '#7F76EB',
                  '--border': col === 'Completed' ? '#F1FEED' : col === 'In-Progress' ? '#FFF3FA' : '#FFFEEF',
                  '--color': col === 'Completed' ? '#31AC1D' : col === 'In-Progress' ? '#F16A9A' : '#F8A300'
                } as React.CSSProperties
              }
            >
              <div className="min-h-full rounded-[8px] bg-[var(--section-bg)] px-[6px] pb-[10px] pt-[0px]">
                <Typography className={styles.colTitle}>
                  <span>
                    <Checkbox
                      size="small"
                      checked={
                        selectedRecords?.length &&
                        selectedRecords?.filter((r) => r?.status === col)?.length &&
                        data[col]?.length === selectedRecords?.filter((r) => r?.status === col)?.length
                      }
                      onChange={(e) => {
                        if (e?.target?.checked) {
                          dispatch({ type: 'selection', selectedRecords: [...uniqBy([...selectedRecords, ...data[col]], '_id')] });
                        } else {
                          dispatch({ type: 'selection', selectedRecords: selectedRecords?.filter((r) => r?.status != col) });
                        }
                      }}
                    />
                  </span>
                  {col} ({count[col] || 0})
                </Typography>
                <RenderColumns
                  column={col}
                  cardOnClick={cardOnClick}
                  passFailStatus={passFailStatus}
                  passFailAccessor={passFailAccessor}
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
