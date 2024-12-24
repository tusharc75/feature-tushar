import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import axios, { CancelTokenSource } from 'axios';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import { CustomDialogTransition, displayDate } from '../../../constants/helpers';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import { CreateNote } from './CreateNote';

export const Note = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    state: { permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchNote(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNote = async (cancelTokenSource?: CancelTokenSource) => {
    setLoading(true);
    axiosInstance()
      .get(`/note?relatedTo=${JSON.stringify(relatedTo)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        setNotes(data);
        onSetCount('Note', count);
        setTimeout(() => setLoading(false), count ? 1000 : 1500);
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
    axiosInstance()
      .delete(`/note/${noteId}`)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setAnchorEl(null);
        fetchNote();
        handleActivityRefresh();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClose = () => {
    fetchNote();
    setOpen(false);
    handleActivityRefresh();
  };
  const handleDialogClose = () => {
    setOpen(false);
  };

  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : notes?.length ? (
        <Fragment>
          {notes.slice(0, 5).map((_note, index) => (
            <Box key={_note._id} className="activity">
              <Box>
                <Grid container>
                  <Grid item xs={10} className="d-flex align-items-center gap-1">
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
                    <span className="activity-date">Created : {displayDate(_note.createdBy.date)}</span>
                  </Grid>
                  {permissions['note']?.isUpdate || permissions['note']?.isDelete ? (
                    <Grid item xs={2} container justify="flex-end">
                      <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _note._id)}>
                        <MoreHorizIcon />
                      </IconButton>
                    </Grid>
                  ) : null}
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={12}>
                    <ListRelatedTo relatedTo={_note.relatedTo} originRelatedTo={relatedTo} />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="note" relatedTo={relatedTo} />
        </Fragment>
      ) : (
        <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
          <Typography variant="subtitle2">No Past Note</Typography>
        </Box>
      )}

      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {permissions['note']?.isUpdate ? <MenuItem onClick={handleEdit}>Edit</MenuItem> : null}
        {permissions['note']?.isDelete ? <MenuItem onClick={handleDelete}>Delete</MenuItem> : null}
      </Menu>

      <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={() => {
          handleDialogClose();
          setFullScreen(false);
        }}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        disableEnforceFocus={true}
      >
        <CreateNote
          noteId={noteId}
          handleClose={() => {
            handleClose();
            setFullScreen(false);
          }}
          relatedTo={relatedTo}
          handleDialogClose={() => {
            handleDialogClose();
            setFullScreen(false);
          }}
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
