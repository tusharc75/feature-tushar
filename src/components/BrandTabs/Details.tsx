import React from 'react';
import { Grid, Box, Typography, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  text: { color: theme.palette.primary.main } //  dargBg
}));

const Details = ({ brand }) => {
  const classes = useStyles();

  return (
    <Grid container>
      <Grid item xs={12} sm={6} md={6}>
        <Box>
          <Typography style={{ fontSize: '14px' }}>Brand Name</Typography>
          <Typography paragraph className={classes.text}>
            {brand.companyName}
          </Typography>
        </Box>
        <Box marginY={2} />
        <Box>
          <Typography style={{ fontSize: '14px' }}>Brand Status</Typography>
          <Typography paragraph className={classes.text}>
            {brand.blocked ? 'Inactive' : 'Active'}
          </Typography>
        </Box>
        <Box marginY={1} />
        <Box>
          <Typography style={{ fontSize: '14px' }}>No. of Users</Typography>
          <Typography paragraph className={classes.text}>
            {brand.user.length}
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <Box>
          <Typography style={{ fontSize: '14px' }}>Address</Typography>
          <Typography paragraph className={classes.text}>
            {brand.address}
          </Typography>
        </Box>
        <Box marginY={2} />
        <Box>
          <Typography style={{ fontSize: '14px' }}>Services</Typography>
          <Typography paragraph className={classes.text}>
            {brand.servicesAccess.join(', ')}
          </Typography>
        </Box>
        <Box marginY={2} />
        <Box>
          <Typography style={{ fontSize: '14px' }}>Contact Details</Typography>
          <Typography paragraph className={classes.text}>
            {brand.contactDetails}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Details;
