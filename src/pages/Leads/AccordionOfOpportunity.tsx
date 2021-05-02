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
import routes from '../../components/Helpers/Routes'
import { Link } from 'react-router-dom'
import ManageOpportunityDialog from '../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog';
import { useHistory } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import currencies from '../../constants/currency_with_country.json';

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

export default function AccordionOfOpportunity({
    opportunityName, opportunityId,
    expanded = true, recordsPerLine = 2,
}) {

    const history = useHistory();
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

    const [expandOpportunity, setExpandOpportunity] = useState(expanded);
    const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);

    // useEffect(() => {
    //     let isExpanded = expandOpportunity
    //     if (opportunities.length === 0 && isExpanded) isExpanded = false
    //     else if (opportunities.length > 0 && !isExpanded) isExpanded = true

    //     setExpandOpportunity(isExpanded)

    // }, [opportunities])
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
                                    Opportunity ({opportunityName?.length > 0 ? 1 : 0})
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

                                <Grid container spacing={1}>
                                    {

                                        <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={1} >
                                            <Card style={{ minWidth: "100%" }}>
                                                <CardContent className="detailListing">

                                                    <Grid container className="detailCardHeader">
                                                        <Grid item xs={12} sm={12}>
                                                            {opportunityName ?
                                                                (<div style={{display:'flex'}}>
                                                                    <h3 style={{marginRight:10}}>Name</h3>
                                                                    <Link className="link" to={`${routes.opportunityDetail.path}/${opportunityId}`}>
                                                                        <Typography>{opportunityName}</Typography>
                                                                    </Link>
                                                                </div>) : <Typography>No Opportunity</Typography>
                                                            }
                                                        </Grid>

                                                    </Grid>

                                                </CardContent>
                                            </Card>
                                        </Grid>

                                    }
                                </Grid>
                            }
                        </>
                    }
                </>
            </AccordionDetails>
            
            <Box margin={1} />
        </Accordion>


    </>
}
