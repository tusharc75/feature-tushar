import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, AppBar, Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { KeyboardDatePicker } from '@material-ui/pickers';
import moment from 'moment';
import FormTypes from '../../components/Helpers/FormTypes';
import { dateFormatForInputControl } from '../../constants/helpers';

const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    padding: 0,
    height: '70px',
    borderRadius: '3px 3px 0 0',
    backgroundColor: 'transparent',
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
  timeFrame: string;
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
  disabled: boolean;
}

const GlobalFilter = ({ globalFilters, setGlobalFilters, dashboardList, disabled }: Props) => {
  const classes = useStyles();

  const [timeFrame, setTimeFrame] = React.useState<any>(null);

  React.useEffect(() => {
    setTimeFrame(globalFilters.timeFrame);
  }, [globalFilters.timeFrame]);

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
      case 'current-year':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(moment().startOf('year').calendar()),
            to: new Date(moment().endOf('year').calendar())
          }
        });
        break;

      default:
        break;
    }
  }, [timeFrame]);

  const handleSelectDashboard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDashboard = e.target.value.toString();
    localStorage.setItem('selectedDashboard', selectedDashboard);
    setGlobalFilters((prevState: GlobalFiltersType) => ({ ...prevState, dashboardType: selectedDashboard }));
    if (dashboardList?.find((e) => e?.name === selectedDashboard)?.defaultDuration) {
      setTimeFrame(dashboardList?.find((e) => e?.name === selectedDashboard)?.defaultDuration);
    }
  };

  return (
    <AppBar className={classes.appBar} position="sticky" elevation={0} style={{ zIndex: 1 }}>
      <Box pt={1}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2}>
              {dashboardList.length !== 0 && (
                <Grid item xs={12} sm={6}>
                  <FormControl disabled={disabled} fullWidth size="small" variant="outlined">
                    <InputLabel id="dashboard-type">Dashboard</InputLabel>
                    <Select labelId="dashboard-type" id="type" value={globalFilters.dashboardType} onChange={handleSelectDashboard} label="Dashboard">
                      {dashboardList.map((d: { name: string; id: string }) => (
                        <MenuItem key={d.id} value={d.name}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormTypes
                  disabled={disabled}
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
          {globalFilters?.timeFrame && globalFilters?.between && (
            <Grid item xs={12} sm={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl disabled={disabled} fullWidth size="small" variant="outlined">
                    <InputLabel id="duration">Select Duration</InputLabel>
                    <Select
                      labelId="duration"
                      id="time-duration"
                      value={timeFrame}
                      onChange={(e) => setTimeFrame(e.target.value)}
                      label="Select Duration"
                    >
                      <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                      <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                      <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                      <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                      <MenuItem value={'current-year'}>Current Year</MenuItem>
                      <MenuItem value={'custom'}>Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <KeyboardDatePicker
                    disabled={timeFrame !== 'custom' || disabled}
                    inputVariant="outlined"
                    variant="inline"
                    fullWidth
                    size="small"
                    openTo="year"
                    autoOk
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
                    disabled={timeFrame !== 'custom' || disabled}
                    inputVariant="outlined"
                    variant="inline"
                    fullWidth
                    size="small"
                    minDate={globalFilters.between.from}
                    openTo="year"
                    autoOk
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
          )}
        </Grid>
      </Box>
    </AppBar>
  );
};

export default GlobalFilter;
