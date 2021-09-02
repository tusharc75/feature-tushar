import { useState, useEffect } from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, Button, Popover, Box, MenuItem, AppBar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { FilterList } from '@material-ui/icons';
import FormTypes from '../../components/Helpers/FormTypes';

const useStyles = makeStyles((theme) => ({
  appBar: {
    padding: 0,
    height: "70px",
    borderRadius: "3px 3px 0 0",
    borderBottom: "1px solid #e1dde6",
    boxShadow: "1px 3px 3px #ddd",
    [theme.breakpoints.down("xs")]: {
      height: "auto",
    }
  },
  currencyBox:{
    width: "250px",
    [theme.breakpoints.down("xs")]: {
      width: "auto",
    }
  }
}));

const Filters = (props) => {
  const classes = useStyles();
  const {
    entities,
    marketSegments,
    subMarketSegments,
    productCategory,
    setSubMarketSegments,
    salesFilter,
    setSalesFilter,
    moment,
    salesReps,
    customerAccounts,
    status,
    setStatus,
    currency,
    setCurrency
  } = props;
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);
  const [timeFrame, setTimeFrame] = useState<any>('1-year');

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setSalesFilter({
          ...salesFilter,
          between: {
            from: new Date(moment().subtract('1', 'month').calendar()),
            to: new Date()
          }
        });
        break;

      case '3-months':
        setSalesFilter({
          ...salesFilter,
          between: {
            from: new Date(moment().subtract('3', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '6-months':
        setSalesFilter({
          ...salesFilter,
          between: {
            from: new Date(moment().subtract('6', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '1-year':
        setSalesFilter({
          ...salesFilter,
          between: {
            from: new Date(moment().subtract('1', 'year').calendar()),
            to: new Date()
          }
        });
        break;

      default:
        break;
    }
  }, [timeFrame]);

  return (
    <AppBar className={classes.appBar} position="sticky" elevation={0} color="default">
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
            />
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
                setSalesFilter({ ...salesFilter, customerAccount: val });
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
          </Box>
        </Box>
      </Popover>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={1}>
                <Button onClick={handleClickFilter} color="primary" endIcon={<FilterList />}>
                  Filters
                </Button>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl style={{ width: '150px' }} size="small" variant="outlined">
                  <InputLabel id="status">Status</InputLabel>
                  <Select labelId="status" id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value={'won'}>Won</MenuItem>
                    <MenuItem value={'lost'}>Lost</MenuItem>
                    <MenuItem value={'open'}>Open</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormTypes
                  fullWidth={false}
                  className={classes.currencyBox}
                  values={{ currency }}
                  type="currency"
                  errors={{ currency: '' }}
                  touched={{ currency: false }}
                  name="currency"
                  label="Currency"
                  size="small"
                  onChange={(e, val) => {
                    if (val && val.currencyCode) {
                      setCurrency(val.currencyCode);
                    } else {
                      setCurrency('');
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id="duration">Select Duration</InputLabel>
                  <Select labelId="duration" id="time-duration" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                    <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                    <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                    <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                    <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                    <MenuItem value={'custom'}>Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <KeyboardDatePicker
                  disabled={timeFrame !== 'custom'}
                  inputVariant="outlined"
                  variant="inline"
                  fullWidth
                  size="small"
                  disableFuture
                  openTo="year"
                  format="MM/dd/yyyy"
                  maxDate={salesFilter.between.from}
                  label="From"
                  views={['year', 'month', 'date']}
                  value={salesFilter.between.from}
                  onChange={(date) => {
                    setSalesFilter({ ...salesFilter, between: { from: date, to: salesFilter.between.to } });
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <KeyboardDatePicker
                  disabled={timeFrame !== 'custom'}
                  inputVariant="outlined"
                  variant="inline"
                  fullWidth
                  size="small"
                  minDate={salesFilter.between.from}
                  disableFuture
                  openTo="year"
                  format="MM/dd/yyyy"
                  label="To"
                  views={['year', 'month', 'date']}
                  value={salesFilter.between.to}
                  onChange={(date) => {
                    setSalesFilter({ ...salesFilter, between: { to: date, from: salesFilter.between.from } });
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {/* <Grid container spacing={2}>
          <Grid item sm={6}></Grid>
          <Grid item sm={6}></Grid>
          <Grid item sm={6}></Grid>
          <Grid item sm={6}></Grid>
          {salesFilter.marketSegment && <Grid item sm={6}></Grid>}
          <Grid item sm={6}></Grid>
        </Grid> */}
      </Box>
    </AppBar>
  );
};

export default Filters;
