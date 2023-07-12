import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, AppBar, Box, makeStyles } from '@material-ui/core';

import FormTypes from '../../components/Helpers/FormTypes';
import DurationFilter from 'src/components/DurationFilter';

const useStyles = makeStyles((theme) => ({
  appBar: {
    padding: 0,
    height: '70px',
    borderRadius: '3px 3px 0 0',
    // borderBottom: '1px solid #e1dde6',
    // boxShadow: '1px 3px 3px #ddd',
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
  dashboardType?: string;
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

  const [duration, setDuration] = React.useState({
    from: globalFilters.between.from,
    to: globalFilters.between.to
  })

  React.useEffect(() => {
    setGlobalFilters({
      ...globalFilters,
      between: {
        from: duration?.from,
        to: duration?.to
      }
    });
  }, [duration])

  const handleSelectDashboard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDashboard = e.target.value.toString();
    localStorage.setItem('selectedDashboard', selectedDashboard);
    setGlobalFilters((prevState: GlobalFiltersType) => ({ ...prevState, dashboardType: selectedDashboard }));
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
          <Grid item xs={12} sm={12} md={6}>
            <DurationFilter
              duration={duration}
              setDuration={setDuration}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Box>
    </AppBar>
  );
};

export default GlobalFilter;
