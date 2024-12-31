import React from 'react';
import { Box, Grid, GridSize } from '@mui/material';
import { Skeleton } from '@mui/material';
import { useAppTheme } from 'src/constants/AppConfig';

function CommonSkeleton({
  lenArray = [...Array(8).keys()],
  sm = 6,
  md = 6,
  xs = 12,
  lg = 6
}: {
  lenArray?: any[];
  sm?: GridSize | boolean;
  md?: GridSize | boolean;
  xs?: GridSize | boolean;
  lg?: GridSize | boolean;
}) {
  const [themeColor] = useAppTheme();
  return (
    <Grid container spacing={2} style={{ background: themeColor === 'light' ? '#fff' : 'var(--dark-primary)' }}>
      {lenArray.map((i, index) => (
        <Grid item sm={sm} md={md} key={index} xs={xs} lg={lg}>
          <Skeleton variant="text" width="100px" height="16px" />
          <Box marginY={1} />
          <Skeleton width="100%" height="50px" />
        </Grid>
      ))}
    </Grid>
  );
}
export default CommonSkeleton;
