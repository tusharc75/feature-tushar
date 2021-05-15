import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, Button, Avatar, List, ListItem, ListItemAvatar, ListItemText, Tooltip } from '@material-ui/core'
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
import { useHistory } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import currencies from './../../constants/currency_with_country.json';
import ManageOpportunityDialog from './../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog';
import { useData } from '../../StateProvider/Provider';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

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

export default function OpportunityAccordionInUserDetail({
    opportunities,
    expanded = true, recordsPerLine = 2, userId, onSuccess
}) {
    const history = useHistory();
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
    const [expandOpportunity, setExpandOpportunity] = useState(expanded);
    const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);

    useEffect(() => {
        let isExpanded = expandOpportunity
        if (opportunities?.length === 0 && isExpanded) isExpanded = false
        else if (opportunities?.length > 0 && !isExpanded) isExpanded = true

        setExpandOpportunity(isExpanded)

    }, [opportunities])
    return <>
        <Accordion expanded={expandOpportunity}>
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
                                    onClick={(event) => setExpandOpportunity(!expandOpportunity)} >
                                    {
                                        expandOpportunity === true ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )
                                    }
                                </IconButton>
                            </Box>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    Opportunity ({opportunities?.length ? opportunities.length : 0})
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end" alignItems="center">
                        <Typography variant="subtitle2">
                            {
                                permissions?.opportunity?.isCreate && <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => { setShowCreateOpportunityDialog(true) }}
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
                        expandOpportunity && <>
                            {
                                opportunities && opportunities?.length ?
                                    <Grid container spacing={1}>
                                        {
                                            opportunities.slice(0, maxRecordsToShow).map((obj, index) => (
                                                <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index} >
                                                    <Card className="accountCard" >
                                                        <CardContent className="detailListing">
                                                            <Grid container className="detailCardHeader">
                                                                <Grid item xs={12} sm={8}>
                                                                    {
                                                                        obj.entity === selectedEntity ? <Link className="link" to={`${routes.opportunityDetail.path}/${obj._id}`}>
                                                                            <Typography>{obj?.opportunityName}</Typography>
                                                                        </Link> : <span className="d-flex gap-2 align-items-center">
                                                                            <Typography>{obj.opportunityName}</Typography> <Tooltip title={`${obj.opportunityName} belongs to different entity`}>
                                                                                <InfoOutlinedIcon fontSize="small" />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }

                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <Typography className="amount">
                                                                        {obj?.amount ? currencies.find(d => d.currencyCode == obj["currency"])?.symbolNative : ''}
                                                                        &nbsp;{obj?.amount ?? ''}</Typography>
                                                                </Grid>
                                                            </Grid>
                                                            <Grid container>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj?.stage ? <DisplayData label='Stage' value={obj?.stage ?? ''} icon={<BiCustomize size={20} />} /> : ''
                                                                    }
                                                                </Grid>
                                                                <Grid item xs={12} sm={12}>
                                                                    {
                                                                        obj.closeDate ? <DisplayData label='Closing Date' value={displayDate(obj.closeDate)} icon={< IoCalendarOutline size={20} />} /> : ''
                                                                    }
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))
                                        }
                                    </Grid> : <Typography variant="subtitle1">No Opportunities To Show</Typography>
                            }
                        </>
                    }
                </>
            </AccordionDetails>
            {
                opportunities?.length > 0 && opportunities.length > recordsPerLine &&
                <Box margin={1} className="btn-view gap-1" onClick={() => {
                    setMaxRecordsToShow(opportunities.length)
                    // history.push(`/opportunity`)
                }} p={1} display="flex" justifyContent="center" alignItems="center">
                    <FaEye /> View All
                </Box>
            }
            <Box margin={1} />
        </Accordion>

        {
            showCreateOpportunityDialog && <ManageOpportunityDialog
                isNew={true}
                open={showCreateOpportunityDialog}
                onClose={() => setShowCreateOpportunityDialog(false)}
                onSuccess={() => {
                    setShowCreateOpportunityDialog(false);
                    onSuccess();
                    // onNewOpportunityAdd();
                }}
                isRedirectTodetailPage={false}
                resource={null}
                userId={userId}
            />
        }

    </>
}
