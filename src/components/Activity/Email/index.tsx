import React, { useState, useEffect, Fragment } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { CreateEmail } from "./CreateEmail";
import { GetEmail, DeleteEmail } from "../../../axios/activity";
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Dialog from '@material-ui/core/Dialog';
import { ListRelatedTo } from '../Helpers/ListRelatedTo'
import { ViewAll } from '../Helpers/ViewAll'
import { useData } from "../../../StateProvider/Provider"
import ActivityLoader from "../../Helpers/ActivityLoader";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";

export const Email = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState(null);
  const [emailId, setEmailId] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [loading, setLoading] = useState(false)
  const {
    state: { user },
  }: any = useData();

  useEffect(() => {
    fetchEmail();
  }, []);

  const fetchEmail = async () => {
    try {
      setLoading(true)
      const emails = await GetEmail(JSON.stringify(relatedTo))
      if (emails.data && emails.data.length > 0) {
        emails.data = emails.data.filter(obj => {
          let isAllowedToShow = false
          if (obj.cc && obj.cc.length) {
            isAllowedToShow = obj.cc.indexOf(user?.user?.email) >= 0
          }
          if (!isAllowedToShow && obj.to && obj.to.length) {
            isAllowedToShow = obj.to.indexOf(user?.user?.email) >= 0
          }
          if (!isAllowedToShow && obj?.sender) {
            isAllowedToShow = obj?.sender === user?.user?._id
          }
          return isAllowedToShow
        })
      }
      setLoading(false)
      setEmails(emails.data)
      onSetCount("Email", emails.data.length)
    } catch (e) {
      setLoading(false)
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
    setOpen(true);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    DeleteEmail(emailId)
      .then(({ data }) => {
        setAnchorEl(null);
        fetchEmail();
        handleActivityRefresh();
      })
      .catch((err) => { });
  };

  const handleClose = () => {
    fetchEmail()
    setOpen(false)
    handleActivityRefresh()
  }
  return (emails &&
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : emails.length ?
        <Fragment>
          {emails.map((_email, index) => (
            <Box key={_email._id} className="activity">
              <Box>
                <Grid container>
                  <Grid item xs={10} className="d-flex align-items-center gap-1">
                    <Typography
                      className="cursor-pointer"
                      variant="subtitle2"
                      onClick={(event) => {
                        setEmailId(_email._id);
                        setOpen(true)
                      }}
                    >{_email?.subject}</Typography>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end" >
                    <IconButton size="small" color="primary" aria-label="delete"
                      onClick={(event) => handleOpenMenu(event, _email._id)} >
                      <MoreHorizIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={12} >
                    <ListRelatedTo relatedTo={_email.relatedTo} originRelatedTo={relatedTo} />
                    {/* <Chip label={_task.status} size="small" color="primary" /> */}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="email" relatedTo={relatedTo} />
        </Fragment>
        : (
          <Box p={1} border={1} borderColor="grey.300" textAlign="center">
            <Typography variant="subtitle2">No Past Email</Typography>
          </Box>
        )}
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEdit}>View</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <Dialog
        open={open}
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={handleClose}
        fullWidth
      >
        <CreateEmail
          emailId={emailId}
          handleClose={handleClose}
          relatedTo={relatedTo}
        />
      </Dialog>
    </Box >
  )
};
