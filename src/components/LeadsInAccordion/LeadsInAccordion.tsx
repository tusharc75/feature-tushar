import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import { withStyles } from "@material-ui/core/styles";
import { Link } from 'react-router-dom'
import { BsBuilding } from 'react-icons/bs';
import { BiPhone } from 'react-icons/bi';
import { AiOutlineMail } from 'react-icons/ai';
import CopyToClipboard from '../Helpers/CopyToClipboard';

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
    },
}))(MuiAccordionDetails);

function DisplayData({ key, label, value, icon, showCopyToText = false }) {
    return <div style={{ flexGrow: 1 }}>
        <List>
            <ListItem key={key}>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={<>
                    <Grid container>
                        <Grid item xs={10} md={10} sm={10} className="text-truncate">{value ? value : '-'} </Grid>
                        <Grid item xs={2} md={2} sm={2} >{showCopyToText ? <CopyToClipboard textToCopy={value} /> : null}</Grid>
                    </Grid> </>
                } secondary={label} />
            </ListItem>
        </List>
    </div>
}

export default function LeadInAccordion({
    expanded = true,
    recordsPerLine = 3,
    lead
}) {

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

    const [expandLead, setExpandLead] = useState(expanded);


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
                                    onClick={() => setExpandLead(!expandLead)} >
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
                                    Leads (1)
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <>
                    {
                        expandLead && <>
                            {
                                <Grid container spacing={1}>
                                    {
                                        <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen}> <Card className="detailCard">
                                            <CardContent className="detailListing">
                                                <Grid container className="detailCardHeader">
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        <Link className="link">
                                                            <Typography className="detailName">{lead.concatedName || `${lead.firstName} ${lead.lastName}`}<span className="role">{lead.title || ""}</span> </Typography>
                                                        </Link>
                                                    </Grid>
                                                </Grid>
                                                <Grid container>
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        {
                                                            <DisplayData key="1" label='Company' icon={<BsBuilding size={15} />} value={lead.company} />
                                                        }
                                                    </Grid>
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        {
                                                            <DisplayData key="2" label='Email' showCopyToText={true} icon={<AiOutlineMail size={15} />} value={lead.email} />
                                                        }
                                                    </Grid>
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        {
                                                            <DisplayData key="3" label='phone' icon={<BiPhone size={15} />} value={lead.phone || lead.mobile} />
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
        </Accordion>
    </>
}