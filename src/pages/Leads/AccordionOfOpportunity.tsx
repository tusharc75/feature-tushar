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
import routes from '../../components/Helpers/Routes'
import { Link } from 'react-router-dom'
import ManageOpportunityDialog from '../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog';
import { useHistory } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import currencies from '../../constants/currency_with_country.json';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { useData } from '../../StateProvider/Provider';

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
export default function AccordionOfOpportunity({
    opportunity, expanded = true, recordsPerLine = 2,
}) {
    const history = useHistory();
    const {
        state: { selectedEntity },
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

    const [expandOpportunity, setExpandOpportunity] = useState(expanded);

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
                                    Opportunity ({opportunity ? 1 : 0})
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                </Grid>
            </AccordionSummary>
            <Box margin={0.50} />
            <AccordionDetails>
                <>
                    {
                        expandOpportunity && <>
                            {
                                opportunity ?
                                    (<Grid container spacing={1}>
                                        {

                                            <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={1} >
                                                <Card style={{ minWidth: "100%" }}>
                                                    <CardContent className="detailListing">

                                                        <Grid container className="detailCardHeader">
                                                            <Grid item xs={12} sm={12}>

                                                                <Grid item xs={12} sm={8}>
                                                                    {
                                                                        opportunity.entity === selectedEntity ? <Link className="link" to={`${routes.opportunityDetail.path}/${opportunity._id}`}>
                                                                            <Typography>{opportunity?.opportunityName}</Typography>
                                                                        </Link> : <span className="d-flex gap-2 align-items-center">
                                                                            <Typography>{opportunity.opportunityName}</Typography> <Tooltip title={`${opportunity.opportunityName} belongs to different entity`}>
                                                                                <InfoOutlinedIcon fontSize="small" />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }

                                                                    <Link className="link" to={`${routes.opportunityDetail.path}/${opportunity._id}`}>
                                                                        <Typography >{opportunity?.opportunityName} </Typography>
                                                                    </Link>
                                                                </Grid>
                                                                {
                                                                    opportunity?.amount &&
                                                                    <Grid item xs={12} sm={4}>
                                                                        <Typography className="amount">
                                                                            {currencies.find(d => d.currencyCode == opportunity["currency"])?.symbolNative}
                                                                        &nbsp;{opportunity?.amount ?? ''}</Typography>
                                                                    </Grid>
                                                                }
                                                                <Grid container>
                                                                    <Grid item xs={12} sm={12}>
                                                                        {
                                                                            opportunity?.stage ? <DisplayData label='Stage' value={opportunity?.stage ?? ''} icon={<BiCustomize size={20} />} /> : ''
                                                                        }
                                                                    </Grid>
                                                                    <Grid item xs={12} sm={12}>
                                                                        {
                                                                            opportunity?.closeDate ? <DisplayData label='Closing Date' value={displayDate(opportunity.closeDate)} icon={< IoCalendarOutline size={20} />} /> : ''
                                                                        }
                                                                    </Grid>
                                                                </Grid>

                                                            </Grid>

                                                        </Grid>

                                                    </CardContent>
                                                </Card>
                                            </Grid>

                                        }
                                    </Grid>) : <Typography variant="subtitle2">No Opportunity To Show</Typography>
                            }
                        </>
                    }
                </>
            </AccordionDetails>

            <Box margin={1} />
        </Accordion>


    </>
}
