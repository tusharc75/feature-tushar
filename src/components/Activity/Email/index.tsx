import React, { useState, useEffect, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { CreateEmail } from './CreateEmail';
import { ViewEmail } from './ViewEmail';
import { GetEmail, DeleteEmail } from '../../../axios/activity';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Dialog from '@material-ui/core/Dialog';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import { useData } from '../../../StateProvider/Provider';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';

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
    fetchEmail();
  }, []);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      const emails = await GetEmail(JSON.stringify(relatedTo));
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
    DeleteEmail(emailId)
      .then(({ data }) => {
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
