import React from 'react';
import { Box, Grid } from '@material-ui/core';
import Chart from 'react-chartjs-2';

const data = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }
  ],
  type: ''
};

const AssetChart = ({ smallScreen }) => {
  return (
    <React.Fragment>
      <Grid container spacing={1} alignItems='flex-end'>
        <Grid item xs={12} sm={6} md={12}>
          <Box height={400}>
            <Chart
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={data}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={12}>
          <Box height={300}>
            <Chart
              options={{
                maintainAspectRatio: false
              }}
              type="bar"
              data={data}
            />
          </Box>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default AssetChart;
