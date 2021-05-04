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
import { HiOutlineUser } from 'react-icons/hi';
import { BsBuilding } from 'react-icons/bs';
import currencies from './../../constants/currency_with_country.json';
import { useData } from '../../StateProvider/Provider';
import ManageLeadDialog from '../Leads/ManageLeadDialog/ManageLeadDialog';
import { FaEye } from 'react-icons/fa';

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
    }

}))(MuiAccordionDetails);

function DisplayData({ label, value, icon }) {
    return <div style={{ flexGrow: 1 }}>
        <List >
            <ListItem>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={value} secondary={label} />
            </ListItem>
        </List>
    </div>
}


export default function LeadAccordionInUserDetailPage({
    leads,
    expanded = true, recordsPerLine = 3, userId, onSuccess
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
            recordsPerLineInLargeScreen = 3;
            break;

        default:
            recordsPerLineInLargeScreen = 6;
            break;
    }

    const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine)
    const [expandLead, setExpandLead] = useState(expanded);
    const [showCreateLeadDialog, setShowCreateLeadDialog] = useState(false)

    useEffect(() => {
        let isExpanded = expandLead
        if (leads?.length === 0 && isExpanded) isExpanded = false
        else if (leads?.length > 0 && !isExpanded) isExpanded = true

        setExpandLead(isExpanded)

    }, [leads])
    return <>
        <Accordion expanded={expandLead}>
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
                            {
                                permissions?.lead?.isCreate && <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => { setShowCreateLeadDialog(true) }}
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
                        expandLead && <>
                            {
                                leads && leads?.length ?
                                    <Grid container spacing={1}>
                                        {
                                            leads.slice(0, maxRecordsToShow).map((obj, index) => (
                                                <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index} >
                                                    <Card style={{ minWidth: "100%" }}>
                                                        <CardContent className="detailListing">

                                                            <Grid container>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.firstName ? <DisplayData label='Name' icon={<HiOutlineUser size={20}/>} value={[obj?.firstName, obj?.lastName].filter(f => f).join(" ")} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.status ? <DisplayData label='Status' icon={<BiCustomize size={20}/>} value={obj?.status ?? ''} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.company ? <DisplayData label='Company' icon={<BsBuilding size={20}/>} value={obj?.company ?? ''} /> : ''
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
                leads?.length > 0 &&
                <Box margin={1} className="btn-view gap-1" onClick={() => {
                    setMaxRecordsToShow(leads.length)
                    // history.push(`/lead`)
                }}
                    p={1} display="flex" justifyContent="center" alignItems="center">
                    <FaEye /> View All
                </Box>
            }
            <Box margin={1} />
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
