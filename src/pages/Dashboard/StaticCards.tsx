import { Box, Grid, Typography, Paper } from '@mui/material';
import styles from './dashboard.module.scss';

const StaticCards = ({ chartData }: any) => {
  if (!chartData) {
    return null;
  }
  return (
    <>
      {chartData?.bookedData &&
        Object.keys(chartData?.bookedData).map((key, index) => (
          <Grid item xs={12} sm={6} md={3} key={key + index}>
            <Box p={2} component={Paper} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
              <Box>
                <Typography className={styles.price}>{chartData?.bookedData[key] ? chartData?.bookedData[key] : 0}</Typography>
                <Typography variant="h6" className={chartData?.additionalData ? styles.title : styles.title_sub}>
                  {key}
                </Typography>
                {chartData?.additionalData && (
                  <p className={styles.hit_ratio}>Hit Ratio: {chartData?.additionalData[key] ? (chartData?.additionalData[key]).toFixed(2) : 0} %</p>
                )}
              </Box>
            </Box>
          </Grid>
        ))}
      {chartData?.offeredData &&
        Object.keys(chartData?.offeredData).map((key, index) => (
          <Grid item xs={12} sm={6} md={3} key={key + index}>
            <Box p={2} component={Paper} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
              <Box>
                <Typography className={styles.price}>{chartData?.offeredData[key] ? chartData?.offeredData[key] : 0}</Typography>
                <Typography variant="h6" className={styles.title_sub}>
                  {key}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
    </>
  );
};

export default StaticCards;
