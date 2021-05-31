import { useState, useEffect, Fragment } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { CreateEvent } from "./CreateEvent";
import { GetEvent, DeleteEvent } from "../../../axios/activity";
import Typography from "@material-ui/core/Typography";
import moment from "moment";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Dialog from "@material-ui/core/Dialog";
import { ListRelatedTo } from "../Helpers/ListRelatedTo";
import { ViewAll } from "../Helpers/ViewAll";
import ActivityLoader from "../../Helpers/ActivityLoader";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";

export const Event = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    setLoading(true);
    await GetEvent(JSON.stringify(relatedTo))
      .then(({ data }) => {
        setEvents(data);
        onSetCount("Event", data.length);
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
    DeleteEvent(eventId)
      .then(({ data }) => {
        setAnchorEl(null);
        fetchEvent();
        handleActivityRefresh();
      })
      .catch((err) => {});
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
          {events.map((_event, index) => (
            <Box className="activity" key={_event._id}>
              <Box>
                <Grid container>
                  <Grid
                    item
                    xs={10}
                    className="d-flex align-items-center gap-1"
                  >
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
                    <span className="activity-date">
                      End Date : {moment(_event.endDate).format("MMM DD YYYY")}
                    </span>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="delete"
                      onClick={(event) => handleOpenMenu(event, _event._id)}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={6}>
                    <ListRelatedTo
                      relatedTo={_event.relatedTo}
                      originRelatedTo={relatedTo}
                    />
                    {/* <Chip label={_event.status} size="small" color="primary" /> */}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="event" relatedTo={relatedTo} />
        </Fragment>
      ) : (
        <Box p={1} border={1} borderColor="grey.300" textAlign="center">
          <Typography variant="subtitle2">No Past Event</Typography>
        </Box>
      )}
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={handleClose}
        fullWidth
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CreateEvent
          eventId={eventId}
          handleClose={handleClose}
          relatedTo={relatedTo}
        />
      </Dialog>
    </Box>
  );
};
