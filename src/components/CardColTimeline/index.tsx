import React, { useEffect, useState } from 'react';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import styles from './index.module.scss';
import { Box, Typography, Grid } from '@material-ui/core';
import RenderColumns from './RenderColumns';
import { GridSize, BoxProps } from '@material-ui/core';

interface cardColInterface extends BoxProps {
  data: any;
  loading: boolean;
  cardOnClick?: (e: React.MouseEvent, data: any) => void;
  cardDataRows: datarowInterface[];
  passFailStatus?: boolean;
  passFailAccessor?: string;
  xs?: boolean | GridSize;
  sm?: boolean | GridSize;
  md?: boolean | GridSize;
  lg?: boolean | GridSize;
  xl?: boolean | GridSize;
  cardHeight?: number;
}

export interface datarowInterface {
  accessor: string;
  title?: string;
  type: 'date' | 'dateTime' | 'text' | 'timer' | 'link' | 'title' | 'linkTitle';
  link?: (data: any) => string;
  renderer?: (data: any) => React.ReactNode;
}

const CardColTimeline: React.FC<cardColInterface> = ({
  data,
  loading,
  cardOnClick = null,
  cardDataRows,
  passFailStatus = true,
  passFailAccessor = 'passfail',
  className = '',
  xs = 12,
  sm = 6,
  md = 4,
  lg = false,
  xl = false,
  cardHeight,
  ...others
}) => {
  const [maxHeightFound, setMaxHeightFound] = useState(0);
  const [minHeight, setMinHeight] = useState<number>(500);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [scrollAmmount, setScrollAmmount] = useState<number>(0);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const item = scrollContainerRef.current;
    item?.addEventListener('scroll', (e) => setScrollAmmount(item.scrollTop));
    return () => item.removeEventListener('scroll', (e) => setScrollAmmount(item.scrollTop));
  }, [scrollContainerRef.current]);

  return (
    <div className="relative mt-[24px]">
      <div className={` overflow-y-auto  absolute inset-0`} ref={scrollContainerRef}>
        <div style={{ height: maxHeightFound + 80 }}></div>
      </div>
      <div className={`${styles.container} ${className}`} {...others}>
        <Grid container spacing={3}>
          {Object.keys(data).map((col, index) => {
            return (
              <Grid
                key={index}
                item
                xs={xs}
                sm={sm}
                md={md}
                lg={lg}
                xl={xl}
                spacing={2}
                className={styles.singleCol}
                style={
                  {
                    '--bg': Boolean(data[col].color)
                      ? data[col].color
                      : col === 'Pending'
                      ? '#F8A300'
                      : col === 'In-Progress'
                      ? '#F16A9A'
                      : col === 'Completed'
                      ? '#31AC1D'
                      : '#7F76EB',
                    '--border': col === 'Completed' ? '#F1FEED' : col === 'In-Progress' ? '#FFF3FA' : '#FFFEEF',
                    '--color': col === 'Completed' ? '#31AC1D' : col === 'In-Progress' ? '#F16A9A' : '#F8A300'
                  } as React.CSSProperties
                }
              >
                <div className="bg-[var(--section-bg)] px-[6px] pb-[10px] pt-[0px] rounded-[8px] min-h-full">
                  <Typography className={styles.colTitle}>
                    <span></span>
                    {col} ({loading ? '--' : data[col].data?.length || data[col].length || 0})
                  </Typography>
                  {loading ? (
                    <Box p={2} height={500}>
                      <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                  ) : (
                    <RenderColumns
                      maxHeightFound={maxHeightFound}
                      setMaxHeightFound={setMaxHeightFound}
                      minHeight={minHeight}
                      setMinHeight={setMinHeight}
                      data={data[col].data || data[col]}
                      cardOnClick={cardOnClick}
                      cardDataRows={cardDataRows}
                      passFailStatus={passFailStatus}
                      passFailAccessor={passFailAccessor}
                      cardHeight={cardHeight}
                      scrollAmmount={scrollAmmount}
                    />
                  )}
                </div>
              </Grid>
            );
          })}
        </Grid>
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
