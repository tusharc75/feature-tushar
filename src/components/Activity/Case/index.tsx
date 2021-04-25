import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CreateCase } from './CreateCase';
import { GetCase, DeleteCase } from "../../../axios/activity";
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import moment from "moment";
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Dialog from '@material-ui/core/Dialog';
import { ListRelatedTo } from '../Helpers/ListRelatedTo'
import { ViewAll } from '../Helpers/ViewAll'

export const Case = ({ relatedTo, handleActivityRefresh }) => {

    const [open, setOpen] = useState(false);
    const [cases, setCases] = useState(null);
    const [caseId, setCaseId] = useState(null);
    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        fetchCash();
    }, []);

    const fetchCash = async () => {
        await GetCase(JSON.stringify(relatedTo))
            .then(({ data }) => {
                setCases(data)
            })
            .catch((err) => {
            });
    };

    const handleOpenMenu = (event, _id) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setCaseId(_id);
    };

    const handleCloseMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        setCaseId(null);
    };


    const handleEdit = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        setOpen(true)
    };


    const handleDelete = (event) => {
        event.stopPropagation();
        DeleteCase(caseId)
            .then(({ data }) => {
                setAnchorEl(null);
                fetchCash()
                handleActivityRefresh()
            })
            .catch((err) => {
            });
    };


    const handleClose = () => {
        fetchCash()
        setOpen(false)
        handleActivityRefresh()
    }

    return (cases &&
        <Box>
            {cases.length ?
                <Fragment>
                    {cases.map((_case, index) => (
                        <Box key={_case._id} mb={1} border={1} p={1} borderColor="grey.300">
                            <Box>
                                <Grid container>
                                    <Grid item xs={8} >
                                        <Typography variant="subtitle2">{_case.name}</Typography>
                                    </Grid>
                                    <Grid item xs={4} container justify="flex-end" >
                                        <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _case._id)} >
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box pt={1}>
                                <Grid container>
                                    <Grid item xs={6} >
                                        <ListRelatedTo relatedTo={_case.relatedTo} originRelatedTo={relatedTo} />
                                        {/* <Chip label={_case.status} size="small" color="primary" /> */}
                                    </Grid>
                                    <Grid item xs={6} container justify="flex-end">
                                        <Typography variant="caption" >Due Date : {moment(_case.dueDate).format("MMM DD YYYY")}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>))}
                    <ViewAll
                        type="case"
                        relatedTo={relatedTo}
                    />
                </Fragment>

                : <Box p={1}>
                    <Typography variant="subtitle2">No Past Case</Typography>
                </Box>
            }
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleEdit} >Edit</MenuItem>
                <MenuItem onClick={handleDelete} >Delete</MenuItem>
            </Menu>
            <Dialog
                open={open}
                aria-labelledby="customized-dialog-title"
                maxWidth="md"
                onClose={handleClose}
                fullWidth
            >
                <CreateCase caseId={caseId} handleClose={handleClose} relatedTo={relatedTo} />
            </Dialog>
        </Box>
    );
}
