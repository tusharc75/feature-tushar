import React from 'react';
import { Box, Grid } from '@material-ui/core';
import Chart from 'react-chartjs-2';

import Loader from '../../../components/Loader'

const data_chart = {
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

interface ChartProps {
  loading: boolean;
  data: any[];
}

const AssetChart = (props: ChartProps) => {
  const { loading, data } = props
  const [barData, setBarData] = React.useState(null)

  const msToH = (msTime: number) => {
    if (!msTime && msTime === 0) return 0
    return msTime / (1000 * 60 * 60)
  }

  React.useEffect(() => {
    if (data.length > 0) {
      const labels = data.map((_d) => _d?.assetNumber)
      const dataSet = data.map((_d) => msToH(_d?.useTime))

      setBarData({
        labels,
        datasets: [{
          label: "Utilization in hours",
          data: dataSet,
          backgroundColor: 'rgb(54, 162, 235)',
          fill: true,
          // borderColor: 'rgb(254, 162, 35)',
          // borderWidth: 2,
        }]
      })
    }
  }, [data])

  if (loading) return <Loader noLoader minHeight={'100%'} text={'Loading chart data...'} />

  if (!barData) return <Loader noLoader minHeight={'100%'} text={'No data available'} />

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
              data={data_chart}
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
              data={barData}
            />
          </Box>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default AssetChart;
