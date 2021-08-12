import { useState, useCallback, useEffect, useRef } from 'react';
import { ClickAwayListener, Divider, makeStyles } from '@material-ui/core';
import { Paper, Typography, Box, Grid, Button, Popper, Grow, MenuItem, MenuList } from '@material-ui/core';

import axiosInstance from '../../axios/axiosInstance';
import { ArrowDropDown, CalendarToday } from '@material-ui/icons';

const useStyles = makeStyles({
  subText: {
    fontWeight: 500
  }
});

const OpportunitiesDashboard = () => {
  const classes = useStyles();
  const [opportunityData, setOpportunityData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [month, setMonth] = useState('currentMonth');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const fetchOpportunityData = useCallback(() => {
    axiosInstance()
      .get('dashboard/opportunities')
      .then(({ data: { data } }) => {
        setOpportunityData(data);
      })
      .catch((err) => {});
  }, []);

  const fetchLeadsData = useCallback(() => {
    axiosInstance()
      .get('dashboard/leads')
      .then(({ data: { data } }) => {
        setLeadData(data);
      })
      .catch((err) => {});
  }, []);

  useEffect(() => {
    fetchOpportunityData();
    fetchLeadsData();
  }, [fetchOpportunityData]);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const handleChangeMonth = (month) => (e) => {
    setMonth(month);
    handleClose(e);
  };

  const getPercent = (prev, current) => {
    let totalIncrease = current - prev;
    let percent = (totalIncrease / current) * 100;

    return percent ? `${Math.floor(percent)}%` : '';
  };

  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Typography variant="h5">Activity Overview</Typography>
      </Box>

      <Divider />
      <Box m={1}>
        <Button
          ref={anchorRef}
          aria-haspopup="true"
          onClick={handleToggle}
          variant="outlined"
          startIcon={<CalendarToday />}
          endIcon={<ArrowDropDown color="disabled" />}
        >
          {month === 'currentMonth' ? 'This Month' : 'Last Month'}
        </Button>
        <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList autoFocusItem={open}>
                    <MenuItem onClick={handleChangeMonth('currentMonth')}>This Month</MenuItem>
                    <MenuItem onClick={handleChangeMonth('prevMonth')}>Last Month</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
      <Divider />

      {opportunityData && leadData && (
        <Box p={2} bgcolor="#efefef">
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined">
                    <Box minWidth="200px" height="200px" p={2}>
                      <Typography color="secondary" variant="h5">
                        {opportunityData?.currentMonth.created}
                      </Typography>
                      <Typography className={classes.subText}>Opportunities</Typography>
                      <Typography>CREATED</Typography>
                      <p
                        style={{
                          color:
                            opportunityData.currentMonth.created > opportunityData.prevMonth.created
                              ? 'green'
                              : opportunityData.currentMonth.created < opportunityData.prevMonth.created
                              ? 'red'
                              : 'darkgray'
                        }}
                      >
                        {getPercent(opportunityData.prevMonth.created, opportunityData.currentMonth.created)}
                      </p>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined">
                    <Box width="200px" height="200px" p={2}>
                      <Typography color="secondary" variant="h5">
                        {opportunityData[month].won}
                      </Typography>
                      <Typography className={classes.subText}>Opportunities</Typography>
                      <Typography>WON</Typography>
                      <p
                        style={{
                          color:
                            opportunityData.currentMonth.won > opportunityData.prevMonth.won
                              ? 'green'
                              : opportunityData.currentMonth.won < opportunityData.prevMonth.won
                              ? 'red'
                              : 'darkgray'
                        }}
                      >
                        {getPercent(opportunityData.prevMonth.won, opportunityData.currentMonth.won)}
                      </p>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined">
                    <Box width="200px" height="200px" p={2}>
                      <Typography color="secondary" variant="h5">
                        {opportunityData[month].lost}
                      </Typography>
                      <Typography className={classes.subText}>Opportunities</Typography>
                      <Typography>LOST</Typography>
                      <p
                        style={{
                          color:
                            opportunityData.currentMonth.lost > opportunityData.prevMonth.lost
                              ? 'green'
                              : opportunityData.currentMonth.lost < opportunityData.prevMonth.lost
                              ? 'red'
                              : 'darkgray'
                        }}
                      >
                        {getPercent(opportunityData.prevMonth.lost, opportunityData.currentMonth.lost)}
                      </p>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined">
                    <Box width="200px" height="200px" p={2}>
                      <Typography color="secondary" variant="h5">
                        {leadData[month].created}
                      </Typography>
                      <Typography className={classes.subText}>Created Leads</Typography>
                      <p
                        style={{
                          color:
                            leadData.currentMonth.created > leadData.prevMonth.created
                              ? 'green'
                              : leadData.currentMonth.created < leadData.prevMonth.created
                              ? 'red'
                              : 'darkgray'
                        }}
                      >
                        {getPercent(leadData.prevMonth.created, leadData.currentMonth.created)}
                      </p>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined">
                    <Box width="200px" height="200px" p={2}>
                      <Typography color="secondary" variant="h5">
                        {leadData[month].converted}
                      </Typography>
                      <Typography className={classes.subText}>Converted Leads</Typography>
                      <p
                        style={{
                          color:
                            leadData.currentMonth.converted > leadData.prevMonth.converted
                              ? 'green'
                              : leadData.currentMonth.converted < leadData.prevMonth.converted
                              ? 'red'
                              : 'darkgray'
                        }}
                      >
                        {getPercent(leadData.prevMonth.converted, leadData.currentMonth.converted)}
                      </p>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined">
                <Box p={2}>
                  <Typography variant="h5">Leaderboard</Typography>
                  <Typography className={classes.subText}>Opportunities</Typography>
                  <Typography>WON - MONTHLY</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default OpportunitiesDashboard;
