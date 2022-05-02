import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, AppBar, Box, makeStyles } from '@material-ui/core';
import { KeyboardDatePicker } from '@material-ui/pickers';
import moment from 'moment';

import FormTypes from '../../components/Helpers/FormTypes';
import { dateFormatForInputControl } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import seed from './seed';

const useStyles = makeStyles((theme) => ({
  appBar: {
    padding: 0,
    height: '70px',
    borderRadius: '3px 3px 0 0',
    borderBottom: '1px solid #e1dde6',
    boxShadow: '1px 3px 3px #ddd',
    [theme.breakpoints.down('sm')]: {
      height: 'auto'
    },
    [theme.breakpoints.down('xs')]: {
      height: 'auto'
    }
  }
}));

export type GlobalFiltersType = {
  dashboardType: string;
  currency: string;
  between: {
    from: Date;
    to: Date;
  };
};

interface Props {
  globalFilters: GlobalFiltersType;
  setGlobalFilters: any;
  dashboardList: any[];
}

const GlobalFilter = ({ globalFilters, setGlobalFilters, dashboardList }: Props) => {
  const classes = useStyles();
  const {
    state: {
      user: { user }
    }
  } = useData();
  // const dashboards = seed.map((s) => s.name);
  const [timeFrame, setTimeFrame] = React.useState<any>('1-year');

  React.useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(moment().subtract('1', 'month').calendar()),
            to: new Date()
          }
        });
        break;

      case '3-months':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(moment().subtract('3', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '6-months':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(moment().subtract('6', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '1-year':
        setGlobalFilters({
          ...globalFilters,
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
      <Box p={1} pt={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id="dashboard-type">Dashboard</InputLabel>
                  <Select
                    labelId="dashboard-type"
                    id="type"
                    value={globalFilters.dashboardType}
                    onChange={(e) => setGlobalFilters((prevState: GlobalFiltersType) => ({ ...prevState, dashboardType: e.target.value.toString() }))}
                  >
                    {dashboardList.map((d: { name: string; id: string }) => (
                      <MenuItem key={d.id} value={d.name}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTypes
                  fullWidth
                  values={{ currency: globalFilters.currency }}
                  type="currency"
                  errors={{ currency: '' }}
                  touched={{ currency: false }}
                  name="currency"
                  label="Currency"
                  size="small"
                  onChange={(e, val) => {
                    if (val && val.currencyCode) {
                      setGlobalFilters((prevState: GlobalFiltersType) => ({ ...prevState, currency: val.currencyCode }));
                    } else {
                      setGlobalFilters((prevState: GlobalFiltersType) => ({ ...prevState, currency: '' }));
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
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
                  format={dateFormatForInputControl}
                  maxDate={globalFilters.between.to}
                  label="From"
                  views={['year', 'month', 'date']}
                  value={globalFilters.between.from}
                  onChange={(date) => {
                    setGlobalFilters({ ...globalFilters, between: { ...globalFilters.between, from: date } });
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
                  minDate={globalFilters.between.from}
                  disableFuture
                  openTo="year"
                  format={dateFormatForInputControl}
                  label="To"
                  views={['year', 'month', 'date']}
                  value={globalFilters.between.to}
                  onChange={(date) => {
                    setGlobalFilters({ ...globalFilters, between: { ...globalFilters.between, to: date } });
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </AppBar>
  );
};

export default GlobalFilter;
