import { useState, useEffect, Fragment } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { CreateNote } from "./CreateNote";
import { GetNote, DeleteNote } from "../../../axios/activity";
import Typography from "@material-ui/core/Typography";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Dialog from "@material-ui/core/Dialog";
import { ListRelatedTo } from "../Helpers/ListRelatedTo";
import { ViewAll } from "../Helpers/ViewAll";
import ActivityLoader from "../../Helpers/ActivityLoader";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, displayDate } from "../../../constants/helpers";

export const Note = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNote();
  }, []);

  const fetchNote = async () => {
    setLoading(true);
    await GetNote(JSON.stringify(relatedTo))
      .then(({ data }) => {
        setNotes(data);
        onSetCount("Note", data.length);
        setTimeout(() => setLoading(false), data.length ? 1000 : 1500);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleOpenMenu = (event, _id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setNoteId(_id);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setNoteId(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setOpen(true);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    DeleteNote(noteId)
      .then(({ data }) => {
        setAnchorEl(null);
        fetchNote();
        handleActivityRefresh();
      })
      .catch((err) => { });
  };

  const handleClose = () => {
    fetchNote();
    setOpen(false);
    handleActivityRefresh();
  };
  const handleDialogClose = () => {
    setOpen(false);
}

  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : notes.length ? (
        <Fragment>
          {notes.map((_note, index) => (
            <Box key={_note._id} className="activity">
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
                        setNoteId(_note._id);
                        setOpen(true);
                      }}
                    >
                      {_note.name}
                    </Typography>
                    <span className="activity-date">
                      Created :{" "}
                      {displayDate(_note.createdBy.date)}
                    </span>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="delete"
                      onClick={(event) => handleOpenMenu(event, _note._id)}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={12}>
                    <ListRelatedTo
                      relatedTo={_note.relatedTo}
                      originRelatedTo={relatedTo}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="note" relatedTo={relatedTo} />
        </Fragment>
      ) : (
        <Box p={1} border={1} borderColor="grey.300" textAlign="center">
          <Typography variant="subtitle2">No Past Note</Typography>
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
        onClose={handleDialogClose}
        fullWidth
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CreateNote
          noteId={noteId}
          handleClose={handleClose}
          relatedTo={relatedTo}
          handleDialogClose={handleDialogClose}
        />
      </Dialog>
    </Box>
  );
};
