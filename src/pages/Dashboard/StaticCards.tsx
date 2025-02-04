import { Box, Typography, Paper, Divider } from '@mui/material';
import Grid from '@mui/material/Grid2';
import styles from './dashboard.module.scss';

const StaticCards = ({ chartData }: any) => {
  if (!chartData) {
    return null;
  }
  return (
    <>
      {Object.keys(chartData)?.map((key, index) => {
        return (
          chartData[key] &&
          chartData[key]?.length > 0 &&
          chartData[key]?.map((obj) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Box className="border" display="flex" flexDirection="column" justifyContent="space-between">
                {Object.keys(obj)?.map((_key, i) =>
                  _key === 'Hit Ratio' ? (
                    <Box pl={2} key={_key + i}>
                      <p className={styles.hit_ratio}>
                        {_key}: {obj[_key] ? obj[_key].toFixed(2) : 0} %
                      </p>
                    </Box>
                  ) : (
                    <Box p={2} key={_key + i}>
                      <Typography className={styles.price}>{obj[_key] ? obj[_key] : 0}</Typography>
                      <Typography variant="h6" className={i === 0 ? styles.title : styles.title_sub}>
                        {_key}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            </Grid>
          ))
        );
      })}
    </>
  );
};

export default StaticCards;
