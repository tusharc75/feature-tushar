import { Grid, Box, Paper, Typography, CircularProgress } from '@material-ui/core';

const dummyData = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
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
  ]
};

const OpportunityDashboards = (props) => {
  const { openQuoteData, oppSalesRep, Chart, oppAccount, oppTrends } = props;
  return (
    <>
      <Grid container spacing={2}>
        <Grid item sm={4}>
          <Paper>
            <Box mb={2} p={2} display="flex" alignItems="center">
              <Box flex={0.5}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress style={{ width: 100, height: 100 }} variant="determinate" value={openQuoteData.percent} />
                  <Box top={0} left={0} bottom={0} right={0} position="absolute" display="flex" alignItems="center" justifyContent="center">
                    <Typography variant="h5" component="div" color="textSecondary">
                      {openQuoteData.percent}%
                    </Typography>
                  </Box>
                </Box>{' '}
              </Box>

              <Box flex={0.5}>
                <Typography variant="h6" color="secondary">
                  Open Quotes
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h5" color="primary">
                    {openQuoteData.open}/
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    {openQuoteData.all}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
          <Paper elevation={2}>
            <Box p={2} textAlign="center">
              <Typography variant="h6">Open Opportunities by Customer Account</Typography>
              <Chart
                type="bar"
                options={{
                  indexAxis: 'y',
                  // Elements options apply to all of the options unless overridden in a dataset
                  // In this case, we are setting the border of each horizontal bar to be 2px wide
                  elements: {
                    bar: {
                      borderWidth: 2
                    }
                  },
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right'
                    },
                    title: {
                      display: false,
                      text: ''
                    }
                  }
                }}
                data={oppAccount}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item sm={4}>
          <Paper elevation={2}>
            <Box p={2} textAlign="center">
              <Typography variant="h6">Open Opportunities by Sales Rep</Typography>
              <Chart type="pie" data={oppSalesRep} />
            </Box>
          </Paper>
        </Grid>
        <Grid item sm={4}>
          <Paper>
            <Box textAlign="center" p={2}>
              <Typography variant="h6">Open Opportunites by Sales Contact</Typography>
              <Chart type="doughnut" data={dummyData} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item sm={6}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6">Opportunity Trends</Typography>

              <Chart type="line" data={oppTrends} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default OpportunityDashboards;
