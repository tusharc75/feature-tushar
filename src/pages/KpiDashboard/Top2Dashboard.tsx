import Chart from 'react-chartjs-2';
import { Box, Paper, Typography } from '@material-ui/core';

const Top2Dashboard = ({ allEntitySalesData }) => {
  return (
    <Paper elevation={2}>
      <Box my={2} p={2}>
        <Box textAlign="center">
          <Typography variant="h5">Total booked value in USD</Typography>
        </Box>

        <Chart type="bar" data={allEntitySalesData} />
      </Box>
    </Paper>
  );
};

export default Top2Dashboard;
