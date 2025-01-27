import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, AppBar, Box, Theme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import FormTypes from '../../components/Helpers/FormTypes';
import CustomDatePicker from 'src/components/CustomDatePicker';
import dayjs from 'dayjs';

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
  const [dateFilter, setDateFilter] = React.useState({
    from: null,
    to: null
  });
  const [inputFormKeyBoard, setInputFromKeyBoard] = React.useState(false);

  React.useEffect(() => {
    setTimeFrame(globalFilters.timeFrame);
  }, [globalFilters.timeFrame]);

  React.useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(dayjs().subtract(1, 'month').toDate()),
            to: new Date()
          }
        });
        setDateFilter({
          from: new Date(dayjs().subtract(1, 'month').toDate()),
          to: new Date()
        });
        break;

      case '3-months':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(dayjs().subtract(3, 'month').toDate()),
            to: new Date()
          }
        });
        setDateFilter({
          from: new Date(dayjs().subtract(3, 'month').toDate()),
          to: new Date()
        });
        break;

      case '6-months':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(dayjs().subtract(6, 'month').toDate()),
            to: new Date()
          }
        });
        setDateFilter({
          from: new Date(dayjs().subtract(6, 'month').toDate()),
          to: new Date()
        });
        break;

      case '1-year':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(dayjs().subtract(1, 'year').toDate()),
            to: new Date()
          }
        });
        setDateFilter({
          from: new Date(dayjs().subtract(1, 'year').toDate()),
          to: new Date()
        });
        break;
      case 'current-year':
        setGlobalFilters({
          ...globalFilters,
          between: {
            from: new Date(dayjs().startOf('year').toDate()),
            to: new Date(dayjs().endOf('year').toDate())
          }
        });
        setDateFilter({
          from: new Date(dayjs().startOf('year').toDate()),
          to: new Date(dayjs().endOf('year').toDate())
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

  React.useEffect(() => {
    if (inputFormKeyBoard && dayjs(dateFilter.from).isValid() && dayjs(dateFilter.to).isValid()) {
      setGlobalFilters({ ...globalFilters, between: { from: dateFilter.from, to: dateFilter.to } });
    }
  }, [dateFilter, inputFormKeyBoard]);

  return (
    <AppBar className={classes.appBar} position="sticky" elevation={0} sx={{ zIndex: 1, '--AppBar-background': 'var(--dark-primary, white)' }}>
      <Box pt={1}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Grid container spacing={2}>
              {dashboardList.length !== 0 && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl disabled={disabled} fullWidth size="small" variant="outlined">
                    <InputLabel id="dashboard-type">Dashboard</InputLabel>
                    <Select
                      labelId="dashboard-type"
                      id="type"
                      value={globalFilters.dashboardType}
                      onChange={handleSelectDashboard}
                      label="Dashboard"
                      size="small"
                    >
                      {dashboardList.map((d: { name: string; id: string }) => (
                        <MenuItem key={d.id} value={d.name}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl disabled={disabled} fullWidth size="small" variant="outlined">
                    <InputLabel id="duration">Select Duration</InputLabel>
                    <Select
                      labelId="duration"
                      id="time-duration"
                      value={timeFrame}
                      onChange={(e) => setTimeFrame(e.target.value)}
                      label="Select Duration"
                      size="small"
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
                <Grid size={{ xs: 6, sm: 4 }}>
                  <CustomDatePicker
                    disabled={timeFrame !== 'custom' || disabled}
                    fullWidth
                    size="small"
                    maxDate={dateFilter.to}
                    label="From"
                    value={dateFilter.from || ''}
                    onChange={(date) => {
                      setInputFromKeyBoard(false);
                      setDateFilter({ ...dateFilter, from: date });
                    }}
                    onAccept={(date) => {
                      setGlobalFilters({ ...globalFilters, between: { ...globalFilters.between, from: date } });
                    }}
                    onInput={() => {
                      setTimeout(() => {
                        setInputFromKeyBoard(true);
                      }, 3000);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <CustomDatePicker
                    disabled={timeFrame !== 'custom' || disabled}
                    fullWidth
                    size="small"
                    minDate={dateFilter.from}
                    label="To"
                    value={dateFilter.to || ''}
                    onChange={(date) => {
                      setInputFromKeyBoard(false);
                      setDateFilter({ ...dateFilter, to: date });
                    }}
                    onAccept={(date) => {
                      setGlobalFilters({ ...globalFilters, between: { ...globalFilters.between, to: date } });
                    }}
                    onInput={() => {
                      setTimeout(() => {
                        setInputFromKeyBoard(true);
                      }, 3000);
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
