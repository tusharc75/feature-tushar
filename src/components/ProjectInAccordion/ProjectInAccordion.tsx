import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, Button, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core'
import CommonSkeleton from '../Helpers/CommonSkeleton'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { withStyles, makeStyles } from "@material-ui/core/styles";
import { displayDate } from '../../services/util';
import { BsClockHistory } from 'react-icons/bs';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom'
import { useHistory } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';

const Accordion = withStyles({
    root: {
        border: "1px solid rgba(0, 0, 0, .125)",
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


function DisplayData({ key, label, value, icon }) {
    return <div style={{ flexGrow: 1 }}>
        <List>
            <ListItem key={key}>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={value ? value : '-'} secondary={label} />
            </ListItem>
        </List>
    </div>
}

export default function ProjectInAccordion({ expanded = true, recordsPerLine = 3 }) {

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
            recordsPerLineInLargeScreen = 3;
            break;

        default:
            recordsPerLineInLargeScreen = 6;
            break;
    }

    const [expandProject, setExpandProject] = useState(expanded);
    return <>
        <Accordion expanded={expandProject} className="omsAccordian accordProject">
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
                                    onClick={(event) => setExpandProject(!expandProject)} >
                                    {
                                        expandProject === true ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )
                                    }
                                </IconButton>
                            </Box>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    Projects (1)
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
                        expandProject && <>
                            {
                                <Grid container spacing={1}>
                                    {
                                        <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen}>
                                            <Card className="detailCard">
                                                <CardContent className="detailListing">
                                                    <Grid container className="detailCardHeader">
                                                        <Grid item xs={12} sm={12}>
                                                            <Link className="link">
                                                                <Typography className="detailName">Project 1</Typography>
                                                            </Link>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container>
                                                        <Grid item xs={12} sm={6} md={6}>
                                                            {
                                                                <DisplayData key={1} label='Status' value="Active" icon={<BsClockHistory size={15} />} />
                                                            }
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={6}>
                                                            {
                                                                <DisplayData key={2} label='Due Date' value="May-20-2021" icon={< IoCalendarOutline size={15} />} />
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
            {/* <Box margin={1} className="btn-view gap-1" onClick={() => { }} p={1} display="flex" justifyContent="center" alignItems="center">
                <FaEye /> View All &#8599;
            </Box>
            <Box margin={1} /> */}
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