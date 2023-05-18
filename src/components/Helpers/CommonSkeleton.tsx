import React from 'react';
import { Box, Grid } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useAppTheme } from 'src/constants/AppConfig';
function CommonSkeleton({ lenArray }) {
  const [themeColor] = useAppTheme();
  return (
    <Grid container spacing={2} style={{ background: themeColor === 'light' ? '#fff' : '#0E0E23' }}>
      {lenArray.map((i, index) => (
        <Grid item sm={6} md={6} key={index}>
          <Skeleton variant="text" width="100px" height="16px" />
          <Box marginY={1} />
          <Skeleton width="100%" height="50px" />
        </Grid>
      ))}
    </Grid>
  );
}
export default CommonSkeleton;
