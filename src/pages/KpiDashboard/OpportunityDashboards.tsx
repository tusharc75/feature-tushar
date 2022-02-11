import { useState, useCallback, useEffect } from 'react';
import Chart from 'react-chartjs-2';
import { Grid, Box, Paper, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Button, Popover, TextField } from '@material-ui/core';

import axiosInstance from '../../axios/axiosInstance';
import OpportunityTable from './OpportunityDashboardTable';
import { FilterList } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import Countries from "../../constants/Country.json"
import { useData } from '../../StateProvider/Provider';

const OpportunityDashboards = (props) => {
  const {
    state: { selectedEntity }
  } = useData();
  const { moment, currency, filterCurrency, getExchangeRates, salesFilter, marketSegments,
    productCategory,
    salesReps,
    customerAccounts } = props;
  const [quoteStatus, setQuoteStatus] = useState('open');
  const [opp1Status, setOpp1Status] = useState('open');
  const [opp2Status, setOpp2Status] = useState('open');
  const [currentFilter, setCurrentFilter] = useState('');
  const [subMarketSegments, setSubMarketSegments] = useState([]);

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

  const [filter, setFilter] = useState({
    marketSegment: {},
    customerAccount: {},
    subMarketSegment: {},
    countrySellTo: {},
    countryBillTo: {}
  });

  const fetchOpportunitySalesRep = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      status: opp2Status,
      marketSegment: filter.marketSegment ? filter.marketSegment['id'] : '',
      subMarketSegment: filter.subMarketSegment ? filter.subMarketSegment['id'] : '',
      customerAccount: filter.customerAccount ? filter.customerAccount['id'] : '',
      countrySellTo: filter.countrySellTo ? filter.countrySellTo["optionValue"] : '',
      countryBillTo: filter.countryBillTo ? filter.countryBillTo["optionValue"] : '',
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
      .get(`/dashboard/quote/sales-rep${url}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const datasets = [];

        for (let d of data) {
          if (d?.user?.firstName && d?.user?.lastName) {
            labels.push(`${d.user.firstName} ${d.user.lastName}`);
          } else {
            labels.push('Deleted User')
          }
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
  }, [selectedEntity, filter, opp2Status, salesFilter]);

  useEffect(() => {
    fetchOpportunitySalesRep();
  }, [fetchOpportunitySalesRep]);

  const fetchOpportunityAccount = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      status: opp1Status,
      marketSegment: filter.marketSegment ? filter.marketSegment['id'] : '',
      subMarketSegment: filter.subMarketSegment ? filter.subMarketSegment['id'] : '',
      customerAccount: filter.customerAccount ? filter.customerAccount['id'] : '',
      countrySellTo: filter.countrySellTo ? filter.countrySellTo["optionValue"] : '',
      countryBillTo: filter.countryBillTo ? filter.countryBillTo["optionValue"] : '',
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
  }, [selectedEntity, filter, opp1Status, salesFilter]);

  useEffect(() => {
    fetchOpportunityAccount();
  }, [fetchOpportunityAccount]);

  const fetchOpenQuote = useCallback(() => {
    let params = {
      status: quoteStatus,
      entity: selectedEntity ? selectedEntity : '',
      marketSegment: filter.marketSegment ? filter.marketSegment['id'] : '',
      subMarketSegment: filter.subMarketSegment ? filter.subMarketSegment['id'] : '',
      customerAccount: filter.customerAccount ? filter.customerAccount['id'] : '',
      countrySellTo: filter.countrySellTo ? filter.countrySellTo["optionValue"] : '',
      countryBillTo: filter.countryBillTo ? filter.countryBillTo["optionValue"] : '',
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
  }, [selectedEntity, filter, quoteStatus, salesFilter.between]);

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
              <FormControl size="small" variant="outlined" fullWidth>
                <InputLabel id="status">Status</InputLabel>
                <Select labelId="status" id="status"
                  fullWidth value={currentFilter === "quote" ? quoteStatus : currentFilter === "customerAccount" ? opp1Status : opp2Status}
                  onChange={(e) => {
                    currentFilter === "quote" ? setQuoteStatus(e.target.value.toString())
                      : currentFilter === "customerAccount" ? setOpp1Status(e.target.value.toString())
                        : setOpp2Status(e.target.value.toString())
                  }}>
                  <MenuItem value={'won'}>Won</MenuItem>
                  <MenuItem value={'open'}>Open</MenuItem>
                  {currentFilter !== "quote" && <MenuItem value={'lost'}>Lost</MenuItem>}
                </Select>
              </FormControl>
              <Box mt={1} />
              {currentFilter !== "customerAccount" && <Autocomplete
                size="small"
                fullWidth
                options={customerAccounts}
                autoHighlight
                value={filter.customerAccount}
                getOptionLabel={(option: any) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  let data = { ...filter, customerAccount: val }
                  if (val?.countryBillTo) {
                    let foundCountry = Countries.find(o => o.optionValue === val?.countryBillTo)
                    if (foundCountry) {
                      data.countryBillTo = foundCountry
                    }
                  }
                  if (val?.countrySellTo) {
                    let foundCountry = Countries.find(o => o.optionValue === val?.countrySellTo)
                    if (foundCountry) {
                      data.countrySellTo = foundCountry
                    }
                  }
                  setFilter({ ...data });
                }}
                renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
              />}
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={marketSegments.filter(d => !d.parentSegment)}
                autoHighlight
                value={filter.marketSegment}
                getOptionLabel={(option: any) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  setFilter({ ...filter, marketSegment: val });
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
                value={filter.subMarketSegment}
                getOptionLabel={(option: any) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => setFilter({ ...filter, subMarketSegment: val })}
                renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={Countries}
                autoHighlight
                value={filter.countrySellTo}
                getOptionLabel={(option: any) => option.optionLabel || ''}
                getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
                onChange={(_, val) => setFilter({ ...filter, countrySellTo: val })}
                renderInput={(params) => <TextField {...params} label="Country Sell To" variant="outlined" />}
              />
              <Box mt={1} />

              <Autocomplete
                size="small"
                fullWidth
                options={Countries}
                autoHighlight
                value={filter?.countryBillTo}
                getOptionLabel={(option: any) => option.optionLabel || ''}
                getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
                onChange={(_, val) => setFilter({ ...filter, countryBillTo: val })}
                renderInput={(params) => <TextField {...params} label="Country Bill To" variant="outlined" />}
              />
            </Box>
          </Box>
        </Popover>
        <Grid item xs={12} sm={4}>
          <Paper style={{ padding: '10px', marginBottom: '16px' }}>
            <Box>
              <Button
                onClick={(event) => {
                  handleClickFilter(event)
                  setCurrentFilter("quote")
                }}
                color="primary"
                endIcon={<FilterList />}>
                Filters
              </Button>

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
              <Button
                onClick={(event) => {
                  handleClickFilter(event)
                  setCurrentFilter("customerAccount")
                }}
                color="primary"
                endIcon={<FilterList />}>
                Filters
              </Button>
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
              <Button
                onClick={(event) => {
                  handleClickFilter(event)
                  setCurrentFilter("salesRep")
                }}
                color="primary"
                endIcon={<FilterList />}>
                Filters
              </Button>
              <Box textAlign="center">
                <Typography variant="h6">{statusText[opp2Status]} Quotes by Sales Rep</Typography>
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
            salesFilter={salesFilter}
            selectedEntity={selectedEntity}
            moment={moment}
            customerAccounts={customerAccounts}
            marketSegments={marketSegments}
            salesReps={salesReps}
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
