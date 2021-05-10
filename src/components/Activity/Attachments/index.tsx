import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Dialog from '@material-ui/core/Dialog';
import { ListRelatedTo } from '../Helpers/ListRelatedTo'
import { ViewAll } from '../Helpers/ViewAll'
import ManageAttachment from "./ManageAttachment"

export default function Attachment({ relatedTo, handleActivityRefresh }) {

    const [open, setOpen] = useState(false);
    const [attachments, setAttachments] = useState(null);
    const [attachmentId, setAttachmentId] = useState(null);
    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        fetchAttachment();
    }, []);

    const fetchAttachment = async () => {
        try {
            // const attachments = await GetEmail(JSON.stringify(relatedTo))
            setAttachments([])
        } catch (e) {
            console.log(e);
        }
    };

    const handleOpenMenu = (event, _id) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setAttachmentId(_id);
    };

    const handleCloseMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        setAttachmentId(null);
    };


    const handleEdit = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        setOpen(true)
    };

    const handleDelete = (event) => {
        event.stopPropagation();
        // DeleteEmail(attachmentId)
        //     .then(({ data }) => {
        //         setAnchorEl(null);
        //         fetchAttachment()
        //         handleActivityRefresh()
        //     })
        //     .catch((err) => {
        //     });
    };

    const handleClose = () => {
        fetchAttachment()
        setOpen(false)
        handleActivityRefresh()
    }
    return (attachments &&
        <Box className="activityDetailBox">
            {attachments.length ?
                <Fragment>
                    {attachments.map((_attachment, index) => (
                        <Box key={_attachment._id} className="activity">
                            <Box>
                                <Grid container>
                                    <Grid item xs={10} className="d-flex align-items-center gap-1">
                                        <Typography variant="subtitle2"></Typography>
                                    </Grid>
                                    <Grid item xs={2} container justify="flex-end" >
                                        <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _attachment._id)} >
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box pt={1}>
                                <Grid container>
                                    <Grid item xs={12} >
                                        <ListRelatedTo relatedTo={_attachment.relatedTo} originRelatedTo={relatedTo} />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>))}
                    <ViewAll
                        type="attachment"
                        relatedTo={relatedTo}
                    />
                </Fragment>
                : <Box p={1} border={1} borderColor="grey.300" textAlign="center">
                    <Typography variant="subtitle2">No Past Attachment</Typography>
                </Box>
            }
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleEdit} >View</MenuItem>
                <MenuItem onClick={handleDelete} >Delete</MenuItem>
            </Menu>
            <Dialog
                open={open}
                aria-labelledby="customized-dialog-title"
                maxWidth="md"
                onClose={handleClose}
                fullWidth>
                <ManageAttachment
                    attachmentId={attachmentId}
                    handleClose={handleClose}
                    relatedTo={relatedTo} />
            </Dialog>
        </Box>
    );
}
