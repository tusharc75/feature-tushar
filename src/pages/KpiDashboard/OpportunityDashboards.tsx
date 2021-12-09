import { useState, useCallback, useEffect } from 'react';
import Chart from 'react-chartjs-2';
import { Grid, Box, Paper, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Button, Popover, TextField } from '@material-ui/core';

import axiosInstance from '../../axios/axiosInstance';
import OpportunityTable from './OpportunityDashboardTable';
import { FilterList } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import Countries from "../../constants/Country.json"

const OpportunityDashboards = (props) => {
  const { moment, currency, filterCurrency, selectedEntity, salesFilter, getExchangeRates, setCurrency, marketSegments,
    subMarketSegments,
    productCategory,
    setSubMarketSegments,
    setSalesFilter,
    salesReps,
    customerAccounts } = props;
  const [quoteStatus, setQuoteStatus] = useState('open');
  const [opp1Status, setOpp1Status] = useState('open');
  const [opp2Status, setOpp2Status] = useState('open');

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

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);

  const fetchOpportunitySalesRep = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      status: opp2Status,
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
  }, [selectedEntity, salesFilter.between, opp2Status]);

  useEffect(() => {
    fetchOpportunitySalesRep();
  }, [fetchOpportunitySalesRep]);

  const fetchOpportunityAccount = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      status: opp1Status,
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
  }, [selectedEntity, salesFilter.between, opp1Status]);

  useEffect(() => {
    fetchOpportunityAccount();
  }, [fetchOpportunityAccount]);

  const fetchOpenQuote = useCallback(() => {
    let params = {
      status: quoteStatus,
      entity: selectedEntity ? selectedEntity : '',
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
  }, [selectedEntity, salesFilter.between, quoteStatus]);

  useEffect(() => {
    fetchOpenQuote();
  }, [fetchOpenQuote]);

  const statusText = {
    open: 'Open',
    won: 'Won',
    lost: 'Lost'
  };

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };


  return (
    <>
      <Grid container spacing={2}>
        <Popover
          open={openFilter}
          anchorEl={filterAnchor}
          onClose={handleClickFilter}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        >
          <Box p={2}>
            <Box width="250px">
              {/* <Autocomplete
              fullWidth
              size="small"
              disabled={salesFilter.allEntity}
              options={entities}
              autoHighlight
              value={salesFilter.entity}
              getOptionLabel={(option) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                setSalesFilter({ ...salesFilter, entity: val });
              }}
              renderInput={(params) => <TextField {...params} label="Entity" variant="outlined" />}
            /> */}
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={salesReps}
                autoHighlight
                value={salesFilter.salesRep}
                getOptionLabel={(option) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  setSalesFilter({ ...salesFilter, salesRep: val });
                }}
                renderInput={(params) => <TextField {...params} label="Sales Rep" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={customerAccounts}
                autoHighlight
                value={salesFilter.customerAccount}
                getOptionLabel={(option) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  let data = { ...salesFilter, customerAccount: val }
                  if (val?.country) {
                    let foundCountry = Countries.find(o => o.optionValue === val?.country)
                    if (foundCountry) {
                      data.country = foundCountry
                    }
                  }
                  setSalesFilter({ ...data });
                }}
                renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={marketSegments}
                autoHighlight
                value={salesFilter.marketSegment}
                getOptionLabel={(option) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  setSalesFilter({ ...salesFilter, marketSegment: val });
                  if (val) {
                    setSubMarketSegments(marketSegments.filter((d) => d?.parentSegment === val?.id));
                  } else {
                    setSubMarketSegments([]);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Market Segment" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={subMarketSegments}
                autoHighlight
                value={salesFilter.subMarketSegment}
                getOptionLabel={(option) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => setSalesFilter({ ...salesFilter, subMarketSegment: val })}
                renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={productCategory}
                autoHighlight
                value={salesFilter.productCategory}
                getOptionLabel={(option) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => setSalesFilter({ ...salesFilter, productCategory: val })}
                renderInput={(params) => <TextField {...params} label="Product Category" variant="outlined" />}
              />
              <Box mt={1} />

              <Autocomplete
                size="small"
                fullWidth
                options={Countries}
                autoHighlight
                value={salesFilter.country}
                getOptionLabel={(option) => option.optionLabel || ''}
                getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
                onChange={(_, val) => setSalesFilter({ ...salesFilter, country: val })}
                renderInput={(params) => <TextField {...params} label="Country" variant="outlined" />}
              />
            </Box>
          </Box>
        </Popover>
        <Grid item xs={12} sm={4}>
          <Paper>
            <Box mb={2} p={2} display="flex" alignItems="center">
              <Box flex={0.5}>
                <Button onClick={handleClickFilter} color="primary" endIcon={<FilterList />}>
                  Filters
                </Button>
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
          <Paper style={{ padding: '10px', marginBottom: '16px' }}>
            <Box>
              <FormControl size="small" variant="outlined">
                <InputLabel id="status">Status</InputLabel>
                <Select labelId="status" id="status" value={quoteStatus} onChange={(e) => setQuoteStatus(e.target.value.toString())}>
                  <MenuItem value={'won'}>Won</MenuItem>
                  <MenuItem value={'open'}>Open</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box my={2} display="flex" >
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

              <Box flex={statusText[quoteStatus] === 'Won' ? 0.7 : 0.5} >
                <Typography variant="h6" color="secondary">
                  {statusText[quoteStatus] === 'Won' ? "Success Rate in" :
                    statusText[quoteStatus] !== 'Lost' ? statusText[quoteStatus] : 'Open'} Quotes
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
            <Box p={2} >
              <FormControl size="small" variant="outlined">
                <InputLabel id="status">Status</InputLabel>
                <Select labelId="status" id="status" value={opp1Status} onChange={(e) => setOpp1Status(e.target.value.toString())}>
                  <MenuItem value={'lost'}>Lost</MenuItem>
                  <MenuItem value={'won'}>Won</MenuItem>
                  <MenuItem value={'open'}>Open</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="h6">{statusText[opp1Status]} Opportunities by Customer Account</Typography>
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
            <Box p={2}>
              <FormControl size="small" variant="outlined">
                <InputLabel id="status">Status</InputLabel>
                <Select labelId="status" id="status" value={opp2Status} onChange={(e) => setOpp2Status(e.target.value.toString())}>
                  <MenuItem value={'lost'}>Lost</MenuItem>
                  <MenuItem value={'won'}>Won</MenuItem>
                  <MenuItem value={'open'}>Open</MenuItem>
                </Select>
              </FormControl>
              <Box textAlign="center">
                <Typography variant="h6">{statusText[opp2Status]} Opportunities by Sales Rep</Typography>
                {oppSalesRep.labels.length > 0
                  ? <Chart type="pie" data={oppSalesRep} />
                  : <Box minHeight={515}>
                    <Typography>No Data</Typography>
                  </Box>}
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpportunityTable
            selectedEntity={selectedEntity}
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
