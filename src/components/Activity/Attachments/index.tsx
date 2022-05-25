import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Dialog from "@material-ui/core/Dialog";
import { ListRelatedTo } from "../Helpers/ListRelatedTo";
import { ViewAll } from "../Helpers/ViewAll";
import ManageAttachment from "./ManageAttachment";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import ActivityLoader from "../../Helpers/ActivityLoader";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";

export default function Attachments({ relatedTo, handleActivityRefresh, onSetCount }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState(null);
  const [attachmentId, setAttachmentId] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [attachmentData, setAttachmentData] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions },
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchAttachment();
  }, []);

  const fetchAttachment = async () => {
    setLoading(true);
    let api = `/attachment?relatedTo=${JSON.stringify(relatedTo)}`
    axiosInstance().get(api)
      .then(({ data: { data: { data, count } } }) => {
        setLoading(false);
        onSetCount("Attachment", count)
        setAttachments(data)
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenMenu = (event, _id, data) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setAttachmentId(_id);
    if (data && data?._id) setAttachmentData(data);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setAttachmentId(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setOpen(true);
  };

  const handleDelete = (event) => {
    if (attachmentId) {
      event.stopPropagation();
      axiosInstance()
        .put('attachment/deletemany ', { ids: [attachmentId] })
        .then(({ data }) => {
          setAnchorEl(null);
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: "Deleted Successfully",
          });
          fetchAttachment();
          handleActivityRefresh();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleClose = () => {
    fetchAttachment();
    setOpen(false);
    if (attachmentData && attachmentData?._id) setAttachmentData(null);
    handleActivityRefresh();
  };
  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : (
        attachments && (
          <>
            {attachments.length ? (
              <Fragment>
                {attachments.slice(0, 5).map((_attachment, index) => (
                  <Box key={_attachment._id} className="activity">
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
                              setAttachmentId(_attachment._id);
                              setOpen(true);
                            }}
                          >
                            {_attachment?.name ?? ""}
                          </Typography>
                        </Grid>
                        {
                          permissions["attachment"]?.isUpdate || permissions["attachment"]?.isDelete ?
                            <Grid item xs={2} container justify="flex-end">
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="delete"
                                onClick={(event) =>
                                  handleOpenMenu(
                                    event,
                                    _attachment._id,
                                    _attachment
                                  )
                                }
                              >
                                <MoreHorizIcon />
                              </IconButton>
                            </Grid>
                            : null}
                      </Grid>
                    </Box>
                    <Box pt={1}>
                      <Grid container>
                        <Grid item xs={12}>
                          <ListRelatedTo
                            relatedTo={_attachment.relatedTo}
                            originRelatedTo={relatedTo}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))}
                <ViewAll type="attachment" relatedTo={relatedTo} />
              </Fragment>
            ) : (
              <Box p={1} border={1} borderColor="grey.300" textAlign="center">
                <Typography variant="subtitle2">No Past Attachment</Typography>
              </Box>
            )}
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              {
                permissions["attachment"]?.isUpdate ?
                  <MenuItem onClick={handleEdit}>Edit</MenuItem> : null}
              {
                permissions["attachment"]?.isDelete ? <MenuItem onClick={handleDelete}>Delete</MenuItem> : null}
            </Menu>
            <Dialog
              open={open}
              aria-labelledby="customized-dialog-title"
              maxWidth="md"
              onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                  handleClose()
                  setFullScreen(false);
                }
              }}
              fullWidth
              fullScreen={fullScreen || (isMobile || isTablet)}
              TransitionComponent={CustomDialogTransition}
            >
              <ManageAttachment
                attachmentId={attachmentId}
                attachmentData={attachmentData}
                handleClose={() => {
                  handleClose()
                  setFullScreen(false);
                }}
                relatedTo={relatedTo}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
              />
            </Dialog>
          </>
        )
      )}
    </Box>
  );
}
