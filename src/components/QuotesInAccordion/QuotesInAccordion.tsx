import React, { useState } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { withStyles } from "@material-ui/core/styles";
import { Link } from 'react-router-dom'
import { FaEye } from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import { IoCalendarOutline } from 'react-icons/io5';

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
        backgroundColor: "rgba(0, 0, 0, .03)",
        borderBottom: "1px solid rgba(0, 0, 0, .125)",
        "&$expanded": {
            minHeight: 56,
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

export default function QuotesInAccordion({ expanded = true, recordsPerLine = 2 }) {

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

    const [expandQuote, setExpandQuote] = useState(expanded);
    return <>
        <Accordion expanded={expandQuote}>
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
                                    onClick={() => setExpandQuote(!expandQuote)} >
                                    {
                                        expandQuote === true ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )
                                    }
                                </IconButton>
                            </Box>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    Quotes (1)
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end">
                        {
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => { }}
                            >
                                <ControlPointIcon />
                            </IconButton>
                        }
                    </Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <>
                    {
                        expandQuote && <>
                            {

                                <Grid container spacing={1}>
                                    {
                                        <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen}>
                                            <Card style={{ minWidth: "100%" }}>
                                                <CardContent className="detailListing">
                                                    <Grid container className="detailCardHeader">
                                                        <Grid item xs={12} sm={12}>
                                                            <Link className="link">
                                                                <Typography >Lead 1</Typography>
                                                            </Link>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container>
                                                        <Grid item xs={12} sm={12}>
                                                            {
                                                                <DisplayData label='Status' value="Active" icon={<BsClockHistory size={20} />} />
                                                            }
                                                        </Grid>
                                                        <Grid item xs={12} sm={12}>
                                                            {
                                                                //TODO :value={displayDate(date)}
                                                                <DisplayData label='Due Date' value="June-21-2021" icon={< IoCalendarOutline size={20} />} />
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
            <Box margin={1} className="btn-view gap-1" onClick={() => { }} p={1} display="flex" justifyContent="center" alignItems="center">
                <FaEye /> View All &#8599;
            </Box>
            <Box margin={1} />
        </Accordion>

        {/* {
            showCreateOpportunityDialog && <ManageOpportunityDialog
                isNew={true}
                open={showCreateOpportunityDialog}
                onClose={() => setShowCreateOpportunityDialog(false)}
                onSuccess={() => {
                    setShowCreateOpportunityDialog(false);
                    onNewOpportunityAdd();
                }}
                accountId={accountId}
                resource={resource}
                isRedirectTodetailPage={isRedirect}
            />
        } */}
    </>

}