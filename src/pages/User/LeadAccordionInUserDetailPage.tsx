import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Tooltip, MenuItem, Menu } from '@material-ui/core'
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { withStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes'
import { Link } from 'react-router-dom'
import { BiCustomize } from 'react-icons/bi';
import { HiOutlineUser } from 'react-icons/hi';
import { BiPhone } from 'react-icons/bi';
import { BsBuilding } from 'react-icons/bs';
import { useData } from '../../StateProvider/Provider';
import ManageLeadDialog from '../Leads/ManageLeadDialog/ManageLeadDialog';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { MoreVert } from '@material-ui/icons';

const Accordion = withStyles({
    root: {
        border: "1px solid rgba(0, 0, 0, .125) !important",
        "&:not(:last-child)": {
            borderBottom: 0,
        },
        "&:before": {
            display: "none",
        },
        "&$expanded": {
            margin: "auto",
        },
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: "white",
        borderBottom: "1px solid #f1ece8",
        background: "#ffffff",
        fontWeight: "bold",
        padding: "0px",
        "&$expanded": {
            minHeight: 46,
        },
    },
    content: {
        "&$expanded": {
            margin: "12px 0",
        },
    },
    expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
    root: {
        padding: theme.spacing(1),
        display: "block",
    }

}))(MuiAccordionDetails);

function DisplayData({ label, value, icon }) {
    return <div style={{ flexGrow: 1 }}>
        <List >
            <ListItem>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={<>
                    <Grid container>
                        <Grid item xs={12} md={11} sm={11} className="text-truncate">{value ? value : '-'} </Grid>
                    </Grid> </>
                } secondary={label} />
            </ListItem>
        </List>
    </div>
}

export default function LeadAccordionInUserDetailPage({
    leads,
    expanded = true, recordsPerLine = 3, userId, onSuccess, isAllowedToEdit
}) {
    const {
        state: { permissions, selectedEntity },
    }: any = useData();

    let recordsPerLineInLargeScreen: 3 | 4 | 6 | 12 = 6;

    switch (recordsPerLine) {
        case 1:
            recordsPerLineInLargeScreen = 12;
            break;

        case 3:
            recordsPerLineInLargeScreen = 4;
            break;

        case 4:
            recordsPerLineInLargeScreen = 3;
            break;

        default:
            recordsPerLineInLargeScreen = 6;
            break;
    }

    const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine)
    const [expandLead, setExpandLead] = useState(expanded);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showCreateLeadDialog, setShowCreateLeadDialog] = useState(false)

    useEffect(() => {
        let isExpanded = expandLead
        if (leads?.length === 0 && isExpanded) isExpanded = false
        else if (leads?.length > 0 && !isExpanded) isExpanded = true

        setExpandLead(isExpanded)

    }, [leads])

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };
    return <>
        <Accordion expanded={expandLead} className="omsAccordian accordLead">
            <AccordionSummary
                aria-controls="user-panel-content"
                id="user-panel-header"
            >
                <Grid container>
                    <Grid item xs={8}>
                        <Box display="flex">
                            <Box>
                                <IconButton
                                    size="small"
                                    onClick={(event) => setExpandLead(!expandLead)} >
                                    {
                                        expandLead === true ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )
                                    }
                                </IconButton>
                            </Box>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    Leads ({leads?.length ? leads.length : 0})
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end" alignItems="center">
                        <Typography variant="subtitle2">
                            {isAllowedToEdit && <>
                                {
                                    permissions?.lead?.isCreate &&
                                    // <IconButton
                                    //     color="primary"
                                    //     size="small"
                                    //     onClick={() => { setShowCreateLeadDialog(true) }}
                                    // >
                                    //     <ControlPointIcon />
                                    // </IconButton> 
                                    <>
                                        <IconButton
                                            aria-haspopup="true"
                                            color="primary"
                                            size="small"
                                            onClick={handleOpenMenu}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                        <Menu
                                            id="menu"
                                            anchorEl={anchorEl}
                                            keepMounted
                                            open={Boolean(anchorEl)}
                                            onClose={handleCloseMenu}
                                        >
                                            <MenuItem
                                                onClick={() => {
                                                    setShowCreateLeadDialog(true);
                                                    handleCloseMenu();
                                                }}
                                            >
                                                Create New
                                            </MenuItem>
                                        </Menu>
                                    </>
                                }
                            </>}
                        </Typography>
                    </Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <>
                    {
                        expandLead && <>
                            {
                                leads && leads?.length ?
                                    <Grid container spacing={1}>
                                        {
                                            leads.slice(0, maxRecordsToShow).map((obj, index) => (
                                                <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index} >
                                                    <Card className="detailCard">
                                                        <CardContent className="detailListing">

                                                            <Grid item xs={12} sm={8}>
                                                                {
                                                                    obj.entity === selectedEntity ? (
                                                                        <Link className="link" to={`${routes.leadDetail.path}/${obj._id}`}>
                                                                            <Typography >{obj?.firstName}  {obj?.lastName} </Typography>
                                                                        </Link>

                                                                    ) : <span className="d-flex gap-2 align-items-center">
                                                                        <Typography>{obj.firstName} {obj.lastName}</Typography> <Tooltip title={`${obj.firstName} ${obj.lastName} belongs to different entity`}>
                                                                            <InfoOutlinedIcon fontSize="small" />
                                                                        </Tooltip>
                                                                    </span>
                                                                }

                                                            </Grid>


                                                            <Grid container>
                                                                <Grid item xs={12} sm={12} md={12}>
                                                                    {
                                                                        obj.firstName ? <DisplayData label='Name' icon={<HiOutlineUser size={15} />} value={[obj?.firstName, obj?.lastName].filter(f => f).join(" ")} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12} md={12}>
                                                                    {
                                                                        obj.status ? <DisplayData label='Status' icon={<BiCustomize size={15} />} value={obj?.status ?? ''} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12} md={12}>
                                                                    {
                                                                        obj.company ? <DisplayData label='Company' icon={<BsBuilding size={15} />} value={obj.company ?? ''} /> : ''

                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12} md={12}>
                                                                    {
                                                                        obj.phone ? <DisplayData label='phone' icon={<BiPhone size={15} />} value={obj.phone ?? ''} /> : ''
                                                                    }
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))
                                        }
                                    </Grid> : <Typography variant="subtitle1">No Leads To Show</Typography>
                            }
                        </>
                    }
                </>
            </AccordionDetails>
            {
                leads?.length > 0 && leads.length > maxRecordsToShow &&
                <Box margin={1} className="btn-view gap-1" onClick={() => {
                    setMaxRecordsToShow(prevState => prevState + (recordsPerLine * 2))
                }} p={1} display="flex" justifyContent="center" alignItems="center">
                    <FaArrowAltCircleDown size={25} />
                </Box>
            }
        </Accordion>

        {
            showCreateLeadDialog && <ManageLeadDialog
                open={showCreateLeadDialog}
                onSuccess={() => {
                    setShowCreateLeadDialog(false);
                    onSuccess();
                }}
                onClose={() => setShowCreateLeadDialog(false)}
                isNew={true}
                dataToUpdate={null}
                leadApi={routes.lead.path}
                isRedirectToDetailPage={false}
                userId={userId}
            />
        }

    </>
}
