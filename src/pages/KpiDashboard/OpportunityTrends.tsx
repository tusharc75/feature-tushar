import { useState, useCallback, useEffect } from 'react';
import Chart from 'react-chartjs-2';
import { Grid, Box, Paper, Typography, Popover, TextField, Button } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { Autocomplete } from '@material-ui/lab';
import { FilterList } from '@material-ui/icons';
import Countries from "../../constants/Country.json"


const OpportunityTrends = (props) => {
  const {
    state: { selectedEntity }
  } = useData();
  const { customerAccounts, marketSegments, salesReps, moment, salesFilter } = props;
  const [oppTrends, setOppTrends] = useState({
    labels: [],
    datasets: []
  });
  const [createdLeads, setCreatedLeads] = useState({
    labels: [],
    datasets: []
  });

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);
  const [subMarketSegments, setSubMarketSegments] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('');

  const [leadFilter, setLeadFilter] = useState({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    countrySellTo: {},
    countryBillTo: {}
  });

  const [oppurtunityFilter, setOppurtunityFilter] = useState({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    countrySellTo: {},
    countryBillTo: {}
  });

  const fetchOppTrends = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      marketSegment: oppurtunityFilter.marketSegment ? oppurtunityFilter.marketSegment['id'] : '',
      subMarketSegment: oppurtunityFilter.subMarketSegment ? oppurtunityFilter.subMarketSegment['id'] : '',
      customerAccount: oppurtunityFilter.customerAccount ? oppurtunityFilter.customerAccount['id'] : '',
      countrySellTo: oppurtunityFilter.countrySellTo ? oppurtunityFilter.countrySellTo["optionValue"] : '',
      countryBillTo: oppurtunityFilter.countryBillTo ? oppurtunityFilter.countryBillTo["optionValue"] : '',
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
      .get(`/dashboard/trend/opportunities${url}`)
      .then(({ data: { data } }) => {
        const won = [];
        const lost = [];
        const open = [];
        const labels = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          if (d.outcome === 'Won') {
            won.push(d.count);
          }
          if (d.outcome === 'Lost') {
            lost.push(d.count);
          }
          if (d.outcome === '') {
            open.push(d.count);
          }

          if (!labels.includes(d.date)) {
            labels.push(d.date);
          }
        }

        setOppTrends({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: [
            {
              type: 'line',
              label: 'Won',
              borderColor: 'rgb(20, 162, 35)',
              backgroundColor: 'rgb(20, 162, 35, 0.4)',
              borderWidth: 2,
              fill: true,
              data: won
            },
            {
              type: 'line',
              label: 'Lost',
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgb(255, 99, 132, 0.4)',
              borderWidth: 2,
              fill: true,
              data: lost
            },
            {
              type: 'line',
              label: 'Open',
              borderColor: 'rgb(250, 155, 80)',
              backgroundColor: 'rgb(250, 155, 80, 0.4)',
              borderWidth: 2,
              fill: true,
              data: open
            }
          ]
        });
      })
      .catch((err) => { });
  }, [oppurtunityFilter, selectedEntity, salesFilter]);

  useEffect(() => {
    fetchOppTrends();
  }, [fetchOppTrends]);

  const fetctCreatedLeads = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      marketSegment: leadFilter.marketSegment ? leadFilter.marketSegment['id'] : '',
      subMarketSegment: leadFilter.subMarketSegment ? leadFilter.subMarketSegment['id'] : '',
      customerAccount: leadFilter.customerAccount ? leadFilter.customerAccount['id'] : '',
      countrySellTo: leadFilter.countrySellTo ? leadFilter.countrySellTo["optionValue"] : '',
      countryBillTo: leadFilter.countryBillTo ? leadFilter.countryBillTo["optionValue"] : '',
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
      .get(`/dashboard/created/leads${url}`)
      .then(({ data: { data } }) => {
        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        const dataset = [];
        const labels = [];

        for (let d of data) {
          dataset.push(d.count);
          labels.push(d.date);
        }

        setCreatedLeads({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: [
            {
              type: 'bar',
              label: 'Lead Count',
              borderColor: 'rgb(20, 162, 35)',
              backgroundColor: 'rgb(20, 162, 35, 0.4)',
              borderWidth: 2,
              fill: true,
              data: dataset
            }
          ]
        });
      })
      .catch((err) => { });
  }, [selectedEntity, leadFilter, salesFilter]);

  useEffect(() => {
    fetctCreatedLeads();
  }, [fetctCreatedLeads]);

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  return (
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
            <Autocomplete
              size="small"
              fullWidth
              options={salesReps}
              autoHighlight
              value={currentFilter === "lead" ? leadFilter.salesRep : oppurtunityFilter.salesRep}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                currentFilter === "lead" ?
                  setLeadFilter({ ...leadFilter, salesRep: val })
                  : setOppurtunityFilter({ ...oppurtunityFilter, salesRep: val });
              }}
              renderInput={(params) => <TextField {...params} label="Sales Rep" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={customerAccounts}
              autoHighlight
              value={currentFilter === "lead" ? leadFilter.customerAccount : oppurtunityFilter.customerAccount}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                let data = currentFilter === "lead" ? { ...leadFilter, customerAccount: val } : { ...oppurtunityFilter, customerAccount: val }
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
                currentFilter === "lead" ?
                  setLeadFilter({ ...data })
                  : setOppurtunityFilter({ ...data })
              }}
              renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={marketSegments.filter(d => !d.parentSegment)}
              autoHighlight
              value={currentFilter === "lead" ? leadFilter.marketSegment : oppurtunityFilter.marketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                currentFilter === "lead" ?
                  setLeadFilter({ ...leadFilter, marketSegment: val })
                  : setOppurtunityFilter({ ...oppurtunityFilter, marketSegment: val });
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
              value={currentFilter === "lead" ? leadFilter.subMarketSegment : oppurtunityFilter.subMarketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => currentFilter === "lead" ?
                setLeadFilter({ ...leadFilter, subMarketSegment: val })
                : setOppurtunityFilter({ ...oppurtunityFilter, subMarketSegment: val })}
              renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={Countries}
              autoHighlight
              value={currentFilter === "lead" ? leadFilter.countrySellTo : oppurtunityFilter.countrySellTo}
              getOptionLabel={(option: any) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => currentFilter === "lead" ?
                setLeadFilter({ ...leadFilter, countrySellTo: val })
                : setOppurtunityFilter({ ...oppurtunityFilter, countrySellTo: val })}
              renderInput={(params) => <TextField {...params} label="Country Sell To" variant="outlined" />}
            />
            <Box mt={1} />

            <Autocomplete
              size="small"
              fullWidth
              options={Countries}
              autoHighlight
              value={currentFilter === "lead" ? leadFilter?.countryBillTo : oppurtunityFilter?.countryBillTo}
              getOptionLabel={(option: any) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => currentFilter === "lead" ?
                setLeadFilter({ ...leadFilter, countryBillTo: val })
                : setOppurtunityFilter({ ...oppurtunityFilter, countryBillTo: val })}
              renderInput={(params) => <TextField {...params} label="Country Bill To" variant="outlined" />}
            />
          </Box>
        </Box>
      </Popover>
      <Grid item xs={12} sm={6}>
        <Paper>
          <Box p={2}>
            <Typography variant="h6">Opportunity Trends</Typography>
            <Button
              onClick={(event) => {
                handleClickFilter(event)
                setCurrentFilter("oppurtunity")
              }}
              color="primary"
              endIcon={<FilterList />}>
              Filters
            </Button>
            <Chart type="line" data={oppTrends} />
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper>
          <Box p={2}>
            <Typography variant="h6">Created Leads</Typography>
            <Button
              onClick={(event) => {
                handleClickFilter(event)
                setCurrentFilter("lead")
              }}
              color="primary"
              endIcon={<FilterList />}>
              Filters
            </Button>
            <Chart type="bar" data={createdLeads} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OpportunityTrends;
