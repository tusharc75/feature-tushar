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
  cardTitleAccessor: string;
  xs?: boolean | GridSize;
  sm?: boolean | GridSize;
  md?: boolean | GridSize;
  lg?: boolean | GridSize;
  xl?: boolean | GridSize;
}

export interface datarowInterface {
  accessor: string;
  title: string;
  type: 'date' | 'dateTime' | 'text' | 'timer';
}

const CardColTimeline: React.FC<cardColInterface> = ({
  data,
  loading,
  cardOnClick = null,
  cardDataRows,
  passFailStatus = true,
  passFailAccessor = 'passfail',
  cardTitleAccessor = '',
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
                {col} ({loading ? '--' : data[col].data?.length || data[col].length})
              </Typography>
              {loading ? (
                <Box p={2} height={500} bgcolor="white">
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              ) : (
                <RenderColumns
                  data={data[col].data || data[col]}
                  cardOnClick={cardOnClick}
                  cardDataRows={cardDataRows}
                  passFailStatus={passFailStatus}
                  passFailAccessor={passFailAccessor}
                  cardTitleAccessor={cardTitleAccessor}
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

export function groupBy(objectArray: any, property: string) {
  return objectArray.reduce((acc, obj) => {
    const key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(obj);
    return acc;
  }, {});
}
