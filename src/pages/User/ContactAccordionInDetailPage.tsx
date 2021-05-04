import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, Button, Avatar, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core'
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { withStyles, makeStyles } from "@material-ui/core/styles";
import { displayDate } from '../../services/util';
import routes from './../../components/Helpers/Routes'
import { Link } from 'react-router-dom'
import ManageOpportunityDialog from '../../pages/Opportunities/ManageOpportunityDialog/ManageOpportunityDialog';
import { useHistory } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import currencies from './../../constants/currency_with_country.json';
import { customerContact, supplierContact, customerAccount, supplierAccount } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import ManageContactDialog from "./../Contact/ManageContact/index";

const Accordion = withStyles({
    root: {
        border: "1px solid rgba(0, 0, 0, .125)",
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
        backgroundColor: "#e4e4e4",
        borderBottom: "1px solid rgba(0, 0, 0, .125)",
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
    },
    amount: {
        float: "right",
        fontWeight: "bold"
    }

}))(MuiAccordionDetails);

function DisplayData({ label, value }) {
    return <div style={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
            <Grid item sm={6} xs={6} md={4}>
                <Typography>{label}</Typography>
            </Grid>
            <Grid item sm={6} xs={6} md={8}>
                <Typography>{value}</Typography>
            </Grid>
        </Grid>
    </div>
}

export default function ContactAccordionInDetailPage({
    contacts, type,
    expanded = true, recordsPerLine = 2, userId, onSuccess
}) {
    const history = useHistory();
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
            recordsPerLineInLargeScreen = 4;
            break;

        default:
            recordsPerLineInLargeScreen = 4;
            break;
    }

    const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine)
    const [expandContact, setExpandContact] = useState(expanded);
    const [showCreateContactDialog, setShowCreateContactDialog] = useState(false)

    useEffect(() => {
        let isExpanded = expandContact
        if (contacts?.length === 0 && isExpanded) isExpanded = false
        else if (contacts?.length > 0 && !isExpanded) isExpanded = true

        setExpandContact(isExpanded)

    }, [contacts])
    return <>
        <Accordion expanded={expandContact}>
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
                                    onClick={(event) => setExpandContact(!expandContact)} >
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
                                (type === "customer" ? permissions?.customerContact?.isCreate : permissions?.supplierContact?.isCreate) && <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => { setShowCreateContactDialog(true) }}
                                >
                                    <ControlPointIcon />
                                </IconButton>
                            }
                        </Typography>
                    </Grid>

                </Grid>
            </AccordionSummary>
            <Box margin={0.50} />
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
                                                    <Card style={{ minWidth: "100%" }}>
                                                        <CardContent className="detailListing">


                                                            <Grid container>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.firstName ? <DisplayData label='First Name' value={obj?.firstName ?? ''} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.middleName ? <DisplayData label='Middle Name' value={obj?.middleName ?? ''} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.lastName ? <DisplayData label='Last Name' value={obj?.lastName ?? ''} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.email ? <DisplayData label='Email' value={obj?.email ?? ''} /> : ''
                                                                    }
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
                contacts?.length > 0 && contacts.length > recordsPerLine &&
                <Box margin={1} className="btn-view gap-1" onClick={() => {
                    // history.push(`/${type === "customer" ? "customer-contact" : "supplier-contact"}`)
                    setMaxRecordsToShow(contacts.length)
                }} p={1} display="flex" justifyContent="center" alignItems="center">
                    <FaEye /> View All
                </Box>
            }
            <Box margin={1} />
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
