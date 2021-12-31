import React from 'react';
import { Box, Grid } from '@material-ui/core';
import Chart from 'react-chartjs-2';

import Loader from '../../../components/Loader'
import { ChartData } from 'chart.js';

interface ChartProps {
  loading: boolean;
  data: any[];
}

const AssetChart = (props: ChartProps) => {
  const { loading, data } = props
  const [barData, setBarData] = React.useState<ChartData>(null)
  const [pieData, setPieData] = React.useState<ChartData>(null)

  const msToH = (msTime: number) => {
    if (!msTime && msTime === 0) return 0
    return msTime / (1000 * 60 * 60)
  }

  React.useEffect(() => {
    if (data.length > 0) {
      const length = data.length;
      let total = data.map((_d) => _d?.inUsePercentage).reduce((acc, val) => acc + val) / length ?? 0;
      total = total !== 0 ? parseFloat(total.toFixed(4)) : total

      const labels = data.map((_d) => _d?.assetNumber)
      const dataSet = data.map((_d) => msToH(_d?.useTime))

      setPieData({
        "labels": [`In Use (${total} %)`, "Total Utilization (%)"],
        datasets: [{
          label: "(%) Utilization",
          data: [total, 100],
          backgroundColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
          ],
          fill: true
        }]
      })

      setBarData({
        labels,
        datasets: [{
          label: "Utilization in hours",
          data: dataSet,
          backgroundColor: 'rgb(54, 162, 235)',

        }]
      })
    }
  }, [data])

  if (loading || !pieData || !barData) return <Loader noLoader minHeight={'100%'} text={'Loading chart data...'} />

  if (!barData) return <Loader noLoader minHeight={'100%'} text={'No data available'} />

  return (
    <React.Fragment>
      <Grid container spacing={2} alignItems='flex-end'>
        <Grid item xs={12} sm={6} md={12}>
          <Box height={300}>
            <Chart
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={pieData}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={12}>
          <Box height={400}>
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
