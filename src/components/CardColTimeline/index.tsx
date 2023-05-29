import React from 'react';
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
}

export interface datarowInterface {
  accessor: string;
  title?: string;
  type: 'date' | 'dateTime' | 'text' | 'timer' | 'link' | 'title' | 'linkTitle';
  link?: (data: any) => string;
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
  ...others
}) => {
  return (
    <Box className={`${styles.container} ${className}`} {...others}>
      <Grid container spacing={3}>
        {Object.keys(data).map((col) => {
          return (
            <Grid
              item
              xs={xs}
              sm={sm}
              md={md}
              lg={lg}
              xl={xl}
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
                  data={data[col].data || data[col]}
                  cardOnClick={cardOnClick}
                  cardDataRows={cardDataRows}
                  passFailStatus={passFailStatus}
                  passFailAccessor={passFailAccessor}
                />
              )}
            </Grid>
          );
        })}
      </Grid>
    </Box>
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
