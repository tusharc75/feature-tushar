import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, MenuItem, Menu } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { withStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes'
import { Link } from 'react-router-dom'
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { customerContact, supplierContact, customerAccount, supplierAccount } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import ManageContactDialog from "./../Contact/ManageContact/index";
import { AiOutlineMail } from 'react-icons/ai';
import { FiStar } from 'react-icons/fi';
import { BiPhone } from 'react-icons/bi';
import CopyToClipboard from "../../components/Helpers/CopyToClipboard"
import { MoreVert } from '@material-ui/icons';

const Accordion = withStyles({
    root: {
        border: "1px solid rgba(0, 0, 0, .125) !important",
        boxShadow: "none",
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

export default function ContactAccordionInDetailPage({
    contacts, type,
    expanded = true, recordsPerLine = 2, userId, onSuccess
}) {
    const {
        state: { permissions },
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
    const [expandContact, setExpandContact] = useState(expanded);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showCreateContactDialog, setShowCreateContactDialog] = useState(false)

    useEffect(() => {
        let isExpanded = expandContact
        if (contacts?.length === 0 && isExpanded) isExpanded = false
        else if (contacts?.length > 0 && !isExpanded) isExpanded = true

        setExpandContact(isExpanded)

    }, [contacts])

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };
    return <>
        <Accordion expanded={expandContact} className="omsAccordian accordContact">
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
                                    onClick={() => setExpandContact(!expandContact)} >
                                    {
                                        expandContact === true ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )
                                    }
                                </IconButton>
                            </Box>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    {type === "customer" ? "Customer Contact" : "Supplier Contact"} ({contacts?.length ?? 0})
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end" alignItems="center">
                        <Typography variant="subtitle2">
                            {
                                (type === "customer" ? permissions?.customerContact?.isCreate : permissions?.supplierContact?.isCreate) &&
                                // <IconButton
                                //     color="primary"
                                //     size="small"
                                //     onClick={() => { setShowCreateContactDialog(true) }}
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
                                                setShowCreateContactDialog(true);
                                                handleCloseMenu();
                                            }}
                                        >
                                            Create New
                                        </MenuItem>
                                    </Menu>
                                </>
                            }
                        </Typography>
                    </Grid>

                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <>
                    {
                        expandContact && <>
                            {
                                contacts && contacts?.length ?
                                    <Grid container spacing={1}>
                                        {
                                            contacts.slice(0, maxRecordsToShow).map((obj, index) => (
                                                <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index} >
                                                    <Card className="detailCard">
                                                        <CardContent className="detailListing userCard">
                                                            <Grid container>
                                                                <Grid item xs={12} sm={12}>
                                                                    <List>
                                                                        <ListItem>
                                                                            <ListItemAvatar>
                                                                                {
                                                                                    obj?.contactLogo ? <Avatar className="d-flex align-items-center gap-1" src={obj?.contactLogo}></Avatar>
                                                                                        : <div data-initials={[obj?.firstName?.charAt(0).toUpperCase(),
                                                                                        obj?.lastName?.charAt(0).toUpperCase()].filter(f => f).join("")}></div>
                                                                                }
                                                                            </ListItemAvatar>
                                                                            <ListItemText className="ml-2"
                                                                                primary={
                                                                                    <Link className="link" to={type === "customer" ? `${routes.customerContactDetail.path}/${obj._id}` : `${routes.supplierContactDetail.path}/${obj._id}`}>
                                                                                        <Typography >{[obj?.firstName, obj?.lastName].filter(f => f).join(" ")} </Typography>
                                                                                    </Link>
                                                                                }
                                                                                secondary={
                                                                                    <React.Fragment>
                                                                                        <Typography
                                                                                            component="p"
                                                                                            variant="body2"
                                                                                            className="cardDetail">
                                                                                            {obj?.title && <span className="d-flex gap-2 align-items-center">
                                                                                                <FiStar size="15" />{obj?.title}
                                                                                            </span>}
                                                                                            {obj?.phone && <span className="d-flex gap-2 align-items-center">
                                                                                                <BiPhone size="15" />{obj?.phone}  <CopyToClipboard textToCopy={obj?.phone} />
                                                                                            </span>}
                                                                                            {obj?.email && <span className="d-flex gap-2 align-items-center">
                                                                                                <AiOutlineMail size="15" />{obj?.email}  <CopyToClipboard textToCopy={obj?.email} />
                                                                                            </span>}
                                                                                        </Typography>
                                                                                    </React.Fragment>
                                                                                }
                                                                            />
                                                                        </ListItem>
                                                                    </List>
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))
                                        }
                                    </Grid> : <Typography variant="subtitle1">No Contacts To Show</Typography>
                            }
                        </>
                    }
                </>
            </AccordionDetails>
            {
                contacts?.length > 0 && contacts.length > maxRecordsToShow &&
                <Box margin={1} className="btn-view gap-1" onClick={() => {
                    // history.push(`/${type === "customer" ? "customer-contact" : "supplier-contact"}`)
                    setMaxRecordsToShow(prevState => prevState + (recordsPerLine * 2))
                }} p={1} display="flex" justifyContent="center" alignItems="center">
                    <FaArrowAltCircleDown size={25} />
                </Box>
            }
        </Accordion>
        {
            showCreateContactDialog && <ManageContactDialog
                open={showCreateContactDialog}
                onClose={() => setShowCreateContactDialog(false)}
                onSuccess={() => {
                    setShowCreateContactDialog(false);
                    onSuccess();
                }}
                contactResource={type === "customer" ? customerContact.contactResource : supplierContact.contactResource}
                contactApi={type === "customer" ? customerContact.contactApi : supplierContact.contactApi}
                account={type === "customer" ? customerAccount : supplierAccount}
                userId={userId}
                isRedirectToDetailPage={false}
            />
        }
    </>
}
