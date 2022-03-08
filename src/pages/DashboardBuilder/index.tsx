import React from 'react';
import { Grid, Box, Divider, Paper, ThemeOptions, IconButton } from '@material-ui/core';
import { Delete, Edit } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { MdDashboardCustomize } from 'react-icons/md';

import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import Builder from './Builder';
import { FormData } from './builderHelpers';

const useClasses = makeStyles((theme: ThemeOptions) => ({
  root: {
    height: 'calc(80vh + 20px)'
  },
  chartViews: {
    overflowY: 'auto',
    height: 'calc(80vh + 10px)'
  },
  paper: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    width: '100%',
    height: '200px',

    '&:hover': {
      icons: {
        display: 'block'
      }
    }
  },
  icons: {
    display: 'none'
  }
}));

const DashboardBuilder = () => {
  const classes = useClasses();
  const [formData, setFormData] = React.useState([]);

  return (
    <div>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: 'Dashboard Builder', path: '' }]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Box display={'flex'} alignItems="center" py={"6px"}>
            <MdDashboardCustomize size={22} className="headerLogo" />
            <Box ml={1}>
              <span className="listingHeader">Dashboard Builder</span>
            </Box>
          </Box>
        </div>
        <Divider />
        <Box bgcolor="#f5f5f5" p={1}>
          <Grid container spacing={2} className={classes.root}>
            <Grid item xs={12} sm={4}>
              <Builder formData={formData} setFormData={setFormData} />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Grid container spacing={1} className={classes.chartViews}>
                {formData.length > 0 &&
                  formData.map((form: FormData, index) => (
                    <Grid item xs={form.column} key={form.chartTitle + ' ' + index}>
                      <Paper className={classes.paper}>
                        <p>{form.chartTitle}</p>
                        <p>col = {form.column}</p>
                        <Box mt={2} className={classes.icons}>
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                          <IconButton size="small">
                            <Delete />
                          </IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default DashboardBuilder;
