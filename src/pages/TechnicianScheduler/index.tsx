import { Box, Grid, makeStyles, Paper, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { Fragment, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import Roadmap from './Roadmap';

const capitalize = (string) => {
  return string?.charAt(0)?.toUpperCase() + string?.slice(1);
};

const useStyles = makeStyles((theme) => ({
  activityContainer: {
    padding: '0 10px 10px'
  },
  activityHeader: {
    background: '#dfdfdf',
    margin: '6px 6px',
    borderRadius: '6px',
    '& .MuiGrid-spacing-xs-1': {
      width: 'calc(100% + 14px)'
    }
  }
}));

function TechnicianScheduler() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const classes = useStyles();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [filter, setFilter] = useState({ view: '', resource: '' });

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: capitalize(routes.technicianScheduler.title) }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Fragment>
          <Box p={1}>
            <Grid container xs={12} md={12} sm={12} spacing={2}>
              <Grid item xs={12} md={6} sm={6}>
                <Autocomplete
                  size="small"
                  fullWidth
                  freeSolo
                  options={['Technician View', 'Order View']}
                  getOptionLabel={(option) => option}
                  value={filter.view || ''}
                  onChange={(event, newValue) => {
                    setFilter({ ...filter, view: newValue });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select View" size="small" variant="outlined" className={isMobile ? 'serchBox' : ''} />
                  )}
                />
              </Grid>
              {filter?.view === 'Order View' && (
                <Grid item xs={12} md={6} sm={6}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    freeSolo
                    options={['Service Order', 'Work Order']}
                    getOptionLabel={(option: any) => option}
                    value={filter.resource || ''}
                    onChange={(event, newValue) => {
                      setFilter({ ...filter, resource: newValue });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Resource" size="small" variant="outlined" className={isMobile ? 'serchBox' : ''} />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
          <Box className={classes.activityContainer}>
            <Roadmap type={null} filter={filter} />
          </Box>
        </Fragment>
      </CustomContainer>
    </Fragment>
  );
}

export default TechnicianScheduler;
