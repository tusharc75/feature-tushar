import { useState, useCallback, useEffect } from 'react';
import Chart from 'react-chartjs-2';
import { Grid, Box, Paper, Typography, CircularProgress } from '@material-ui/core';

import axiosInstance from '../../axios/axiosInstance';
import OpportunityTable from './OpportunityDashboardTable';

const OpportunityDashboards = (props) => {
  const { currency, status, filterCurrency, salesFilter, getExchangeRates, moment } = props;

  const [openQuoteData, setOpenQuoteData] = useState({
    all: 0,
    open: 0,
    percent: 0
  });
  const [oppSalesRep, setOppSalesRep] = useState({
    labels: [],
    datasets: []
  });
  const [oppAccount, setOppAccount] = useState({
    labels: [],
    datasets: []
  });

  const fetchOpportunitySalesRep = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      status,
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`/dashboard/opportunities/sales-rep${url}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const datasets = [];

        for (let d of data) {
          labels.push(`${d.user.firstName} ${d.user.lastName}`);
          datasets.push(d.count);
        }

        setOppSalesRep({
          labels,
          datasets: [
            {
              label: '',
              data: datasets,
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
        });
      })
      .catch((err) => { });
  }, [salesFilter.entity, salesFilter.between, status]);

  useEffect(() => {
    fetchOpportunitySalesRep();
  }, [fetchOpportunitySalesRep]);

  const fetchOpportunityContact = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      status,
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`/dashboard/opportunities/customer-account${url}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const datasets = [];

        for (let d of data) {
          labels.push(d.customerAccount);
          datasets.push(d.count);
        }

        setOppAccount({
          labels,
          datasets: [
            {
              label: '',
              data: datasets,
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
        });
      })
      .catch((err) => { });
  }, [salesFilter.entity, salesFilter.between, status]);

  useEffect(() => {
    fetchOpportunityContact();
  }, [fetchOpportunityContact]);

  const fetchOpenQuote = useCallback(() => {
    let params = {
      status: status === 'open' || status === 'lost' ? 'open' : 'won',
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }

    axiosInstance()
      .get(`/dashboard/open-quote${url}`)
      .then(({ data: { data } }) => {
        setOpenQuoteData({
          all: data.count,
          open: data.open,
          percent: data.count === 0 ? 0 : Math.floor((data.open / data.count) * 100)
        });
      })
      .catch((err) => { });
  }, [salesFilter.entity, salesFilter.between, status]);

  useEffect(() => {
    fetchOpenQuote();
  }, [fetchOpenQuote]);

  const statusText = {
    open: 'Open',
    won: 'Won',
    lost: 'Lost'
  };
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper>
            <Box mb={2} p={2} display="flex" alignItems="center">
              <Box flex={0.5}>
                <Typography variant="h6" color="secondary">
                  Number Of Quotes
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h6" color="textSecondary">
                    {openQuoteData.all ?? 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
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
                  {openQuoteData.open &&
                    <Typography variant="h5" color="primary">
                      {openQuoteData.open}/
                    </Typography>
                  }
                  {openQuoteData.open > 0 &&
                    <Typography variant="h6" color="textSecondary">
                      {openQuoteData.all}
                    </Typography>
                  }
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
                        label: function (tooltipItem) {
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
        <Grid item xs={12} sm={4}>
          <Paper elevation={2}>
            <Box p={2} textAlign="center">
              <Typography variant="h6">{statusText[status]} Opportunities by Sales Rep</Typography>
              <Chart type="pie" data={oppSalesRep} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpportunityTable
            moment={moment}
            salesFilter={salesFilter}
            filterCurrency={filterCurrency}
            currency={currency}
            getExchangeRates={getExchangeRates}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default OpportunityDashboards;
