import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import axios, { CancelTokenSource } from 'axios';
import React, { Fragment, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import { CustomDialogTransition } from '../../../constants/helpers';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import { CreateEmail } from './CreateEmail';
import { ViewEmail } from './ViewEmail';

export const Email = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [openViewEmail, setOpenViewEmail] = useState(false);
  const [fullScreenViewEmail, setFullScreenViewEmail] = useState(true);
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState(null);
  const [emailId, setEmailId] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [loading, setLoading] = useState(false);
  const {
    state: { user, permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchEmail(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmail = async (cancelTokenSource?: CancelTokenSource) => {
    try {
      setLoading(true);
      const { data: emails } = await axiosInstance().get(`/email?relatedTo=${JSON.stringify(relatedTo)}`, { cancelToken: cancelTokenSource?.token });
      if (emails.data && emails.data.length > 0) {
        emails.data = emails.data.filter((obj) => {
          let isAllowedToShow = false;
          if (obj.cc && obj.cc.length) {
            isAllowedToShow = obj.cc.indexOf(user?.user?.email) >= 0;
          }
          if (!isAllowedToShow && obj.to && obj.to.length) {
            isAllowedToShow = obj.to.indexOf(user?.user?.email) >= 0;
          }
          if (!isAllowedToShow && obj?.sender) {
            isAllowedToShow = obj?.sender === user?.user?._id;
          }
          return isAllowedToShow;
        });
      }
      setLoading(false);
      setEmails(emails.data);
      onSetCount('Email', emails.data.length);
    } catch (e) {
      setLoading(false);
    }
  };

  const handleOpenMenu = (event, _id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setEmailId(_id);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setEmailId(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setOpenViewEmail(true);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    axiosInstance()
      .delete(`/email/${emailId}`)
      .then(() => {
        setAnchorEl(null);
        fetchEmail();
        handleActivityRefresh();
      })
      .catch((err) => {});
  };

  const handleClose = () => {
    fetchEmail();
    setOpen(false);
    handleActivityRefresh();
  };

  const handleCloseViewEmail = () => {
    setEmailId(null);
    setOpenViewEmail(false);
  };

  return (
    emails && (
      <Box className="activityDetailBox">
        {loading ? (
          <ActivityLoader />
        ) : emails.length ? (
          <Fragment>
            {emails.slice(0, 5).map((_email, index) => (
              <Box key={_email._id} className="activity">
                <Box>
                  <Grid container>
                    <Grid item xs={10} className="d-flex align-items-center gap-1">
                      <Typography
                        className="cursor-pointer"
                        variant="subtitle2"
                        onClick={(event) => {
                          setEmailId(_email._id);
                          setOpenViewEmail(true);
                        }}
                      >
                        {_email?.subject}
                      </Typography>
                    </Grid>
                    {permissions['email']?.isDelete || permissions['email']?.isRead ? (
                      <Grid item xs={2} container justify="flex-end">
                        <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _email._id)}>
                          <MoreHorizIcon />
                        </IconButton>
                      </Grid>
                    ) : null}
                  </Grid>
                </Box>
                <Box pt={1}>
                  <Grid container>
                    <Grid item xs={12}>
                      <ListRelatedTo relatedTo={_email.relatedTo} originRelatedTo={relatedTo} />
                      {/* <Chip label={_task.status} size="small" color="primary" /> */}
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            ))}
            <ViewAll type="email" relatedTo={relatedTo} />
          </Fragment>
        ) : (
          <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
            <Typography variant="subtitle2">No Past Email</Typography>
          </Box>
        )}
        <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          {permissions['email']?.isRead ? <MenuItem onClick={handleEdit}>View</MenuItem> : null}
          {permissions['email']?.isDelete ? <MenuItem onClick={handleDelete}>Delete</MenuItem> : null}
        </Menu>
        <Dialog
          open={open}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              handleClose();
              setFullScreen(false);
            }
          }}
          disableEnforceFocus={true}
          fullWidth
        >
          <CreateEmail
            emailId={emailId}
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
        {openViewEmail ? (
          <Dialog
            open={openViewEmail}
            fullScreen={fullScreenViewEmail || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="view-email-dialog-title"
            maxWidth="md"
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleCloseViewEmail();
              }
            }}
            fullWidth
            disableEnforceFocus={true}
          >
            <ViewEmail
              emailId={emailId}
              handleClose={() => {
                handleCloseViewEmail();
              }}
              relatedTo={relatedTo}
              isMinimized={!fullScreenViewEmail}
              onMinimizeMaximize={() => {
                setFullScreenViewEmail((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          </Dialog>
        ) : null}
      </Box>
    )
  );
};
