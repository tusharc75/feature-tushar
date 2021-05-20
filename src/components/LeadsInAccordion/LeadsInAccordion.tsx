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
import routes from './../../components/Helpers/Routes'
import { Link } from 'react-router-dom'
import ManageLeadDialog from '../../pages/Leads/ManageLeadDialog/ManageLeadDialog'
import { useHistory } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { BsBuilding } from 'react-icons/bs';
import { BiPhone } from 'react-icons/bi';
import { AiOutlineMail } from 'react-icons/ai';
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

export default function LeadInAccordion({
    expanded = true,
    recordsPerLine = 3,
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
            recordsPerLineInLargeScreen = 3;
            break;

        default:
            recordsPerLineInLargeScreen = 6;
            break;
    }

    const [expandLead, setExpandLead] = useState(expanded);
    const [showCreateLeadDialog, setShowCreateLeadDialog] = useState(false);


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
                                    Leads (1)
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end">
                        {
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => { setShowCreateLeadDialog(true) }}
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
                        expandLead && <>
                            {

                                <Grid container spacing={1}>
                                    {

                                        <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen}> <Card className="detailCard">
                                            <CardContent className="detailListing">
                                                <Grid container className="detailCardHeader">
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        <Link className="link">
                                                            <Typography className="detailName">Samsher Singh <span className="role">(Manager)</span> </Typography>
                                                        </Link>
                                                    </Grid>
                                                </Grid>
                                                <Grid container>
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        {
                                                            <DisplayData key="1" label='Company' icon={<BsBuilding size={15} />} value="Adani" />
                                                        }
                                                    </Grid>
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        {
                                                            <DisplayData key="2" label='Email' icon={<AiOutlineMail size={15} />} value="samsher@adani.com" />
                                                        }
                                                    </Grid>
                                                    <Grid item xs={12} sm={12} md={12}>
                                                        {
                                                            <DisplayData key="3" label='phone' icon={<BiPhone size={15} />} value="2131232124" />
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
            showCreateLeadDialog && <ManageLeadDialog
                isNew={true}
                open={showCreateLeadDialog}
                onClose={() => setShowCreateLeadDialog(false)}
                onSuccess={() => {
                    setShowCreateLeadDialog(false);
                    onNewLeadAdd();
                }}
                dataToUpdate={null}
                leadApi={leadApi}
                // accountId={accountId}
                // resource={resource}
                // isRedirectTodetailPage={false}
            />
        } */}
    </>

}