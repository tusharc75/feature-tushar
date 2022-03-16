import React from 'react';
import { Grid, Box, Divider, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { MdDashboardCustomize } from 'react-icons/md';

import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import Builder from './Builder';
import { IFormDataType } from './builderHelpers';
import View from './View';

const useClasses = makeStyles(() => ({
  root: {
    height: 'calc(80vh + 20px)'
  }
}));

const DashboardBuilder = () => {
  const classes = useClasses();
  const [formData, setFormData] = React.useState<IFormDataType[]>([]);

  return (
    <div>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: 'Dashboard Builder', path: '' }]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <Box className="header-panel" display="flex" py={'6px'} justifyContent="space-between">
          <Box display={'flex'} alignItems="center" >
            <MdDashboardCustomize size={22} className="headerLogo" />
            <Box ml={1}>
              <span className="listingHeader">Dashboard Builder</span>
            </Box>
          </Box>
          <Box py={'6px'}>
            <Button color='primary' variant='contained' size='small' disableRipple>Save</Button>
          </Box>
        </Box>
        <Divider />
        <Box bgcolor="#f5f5f5" p={1}>
          <Grid container spacing={2} className={classes.root}>
            <Grid item xs={12} sm={4}>
              <Builder formData={formData} setFormData={setFormData} />
            </Grid>
            <Grid item xs={12} sm={8}>
              <View formData={formData} setFormData={setFormData} />
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default DashboardBuilder;
