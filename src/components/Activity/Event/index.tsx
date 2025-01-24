import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import axios, { CancelTokenSource } from 'axios';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, displayDate } from '../../../constants/helpers';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import { CreateEvent } from './CreateEvent';

export const Event = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchEvent(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvent = async (cancelTokenSource?: CancelTokenSource) => {
    setLoading(true);
    axiosInstance()
      .get(`/event?relatedTo=${JSON.stringify(relatedTo)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setEvents(data);
        onSetCount('Event', data.length);
        setTimeout(() => setLoading(false), data.length ? 1000 : 1500);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleOpenMenu = (event, _id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setEventId(_id);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setEventId(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setOpen(true);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    axiosInstance()
      .delete(`/event/${eventId}`)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setAnchorEl(null);
        fetchEvent();
        handleActivityRefresh();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClose = () => {
    fetchEvent();
    setOpen(false);
    handleActivityRefresh();
  };

  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : events.length ? (
        <Fragment>
          {events.slice(0, 5).map((_event, index) => (
            <Box className="activity" key={_event._id}>
              <Box>
                <Grid container>
                  <Grid item xs={10} className="d-flex align-items-center gap-1 ">
                    <Typography
                      variant="subtitle2"
                      className="cursor-pointer"
                      onClick={() => {
                        setEventId(_event._id);
                        setOpen(true);
                      }}
                    >
                      {_event.name}
                    </Typography>
                    <span className="activity-date">End Date : {displayDate(_event.endDate)}</span>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end">
                    <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _event._id)}>
                      <MoreHorizIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={6}>
                    <ListRelatedTo relatedTo={_event.relatedTo} originRelatedTo={relatedTo} />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="event" relatedTo={relatedTo} />
        </Fragment>
      ) : (
        <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
          <Typography variant="subtitle2">No Past Event</Typography>
        </Box>
      )}
      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
            setFullScreen(false);
          }
        }}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CreateEvent
          eventId={eventId}
          handleClose={() => {
            handleClose();
            setFullScreen(false);
          }}
          relatedTo={relatedTo}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
      </Dialog>
    </Box>
  );
};
