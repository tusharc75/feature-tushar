import Chart from 'react-chartjs-2';
import { Grid, Box, Paper, Typography, CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { useState } from 'react';

const OpportunityDashboards = (props) => {
  const { currency, openQuoteData, oppSalesRep, oppAccount, oppTrends, topProducts, createdLeads, status } = props;
  const [toggleButtonValue, setToggleButtonValue] = useState("totalSell")

  const statusText = {
    open: 'Open',
    won: 'Won',
    lost: 'Lost'
  };
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
                  {statusText[status] !== 'Lost' ? statusText[status] : 'Open'} Quotes
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
              <Typography variant="h6">{statusText[status]} Opportunities by Customer Account</Typography>
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
                      display: false
                    },
                    tooltips: {
                      callbacks: {
                         label: function(tooltipItem) {
                                return tooltipItem.yLabel;
                         }
                      }
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
              <Typography variant="h6">{statusText[status]} Opportunities by Sales Rep</Typography>
              <Chart type="pie" data={oppSalesRep} />
            </Box>
          </Paper>
        </Grid>
        <Grid item sm={4}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6" color="textSecondary">
                Top Selling Product Category
              </Typography>
              <Box mt={1} />
              <ToggleButtonGroup value={toggleButtonValue} exclusive onChange={(e, val) => setToggleButtonValue(val)} size="small">
                <ToggleButton value="totalSell">Total Sell</ToggleButton>
                <ToggleButton value="totalCost">Total Cost</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <List style={{overflow: "auto", maxHeight: 450}}>
              {topProducts.length ? (
                topProducts.map((product, i) => (
                  <ListItem divider key={i}>
                    <ListItemText primary={product.productCategory} />
                    <ListItemSecondaryAction>
                      <Typography>{product[toggleButtonValue] ? formatAmountWithCurrency(currency, product[toggleButtonValue]).fullFormatAmount : 0}</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary={'No Data'} />
                </ListItem>
              )}
            </List>
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
        <Grid item sm={6}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6">Created Leads</Typography>

              <Chart type="bar" data={createdLeads} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default OpportunityDashboards;
