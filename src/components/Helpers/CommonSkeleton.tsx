import { Box, } from '@mui/material';
import { Skeleton } from '@mui/material';
import { useAppTheme } from 'src/constants/AppConfig';
import Grid from '@mui/material/Grid2';

function CommonSkeleton({
  lenArray = [...Array(10).keys()],
  sm = 6,
  md = 6,
  xs = 12,
  lg = 6
}: {
  lenArray?: any[];
  sm?: any;
  md?: any;
  xs?: any;
  lg?: any;
}) {
  const [themeColor] = useAppTheme();
  return (
    <Grid container spacing={2} style={{ background: themeColor === 'light' ? '#fff' : 'var(--dark-primary)' }}>
      {lenArray.map((i, index) => (
        <Grid size={{ sm: sm, md: md, xs: xs, lg: lg }} key={index} >
          <Skeleton variant="text" width="100px" height="16px" />
          <Box marginY={1} />
          <Skeleton width="100%" height="50px" />
        </Grid>
      ))
      }
    </Grid >
  );
}
export default CommonSkeleton;
