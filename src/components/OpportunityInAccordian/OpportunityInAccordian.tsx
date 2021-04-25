import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, Button } from '@material-ui/core'
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
import ManageOpportunityDialog from '../../pages/Opportunities/ManageOpportunityDialog/ManageOpportunityDialog';
import { useHistory } from 'react-router-dom';

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
        borderRadius: "10px",
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: "rgba(0, 0, 0, .03)",
        borderBottom: "1px solid rgba(0, 0, 0, .125)",
        marginBottom: -1,
        minHeight: 56,
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

export default function OpportunityInAccordian({
    opportunities, onNewOpportunityAdd, accountId, accountName,
    expanded = true, recordsPerLine = 2, opportunityPermissions, resource
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

    const [expandOpportunity, setExpandOpportunity] = useState(expanded);
    const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);

    useEffect(() => {
        let isExpanded = expandOpportunity
        if (opportunities.length === 0 && isExpanded) isExpanded = false
        else if (opportunities.length > 0 && !isExpanded) isExpanded = true

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
                                    Opportunity ({opportunities.length})
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end">
                        {
                            opportunityPermissions.isCreate && <IconButton
                                color="primary"
                                size="small"
                                onClick={() => { setShowCreateOpportunityDialog(true) }}
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
                        expandOpportunity && <>
                            {
                                opportunities && opportunities.length ?
                                    <Grid container spacing={1}>
                                        {
                                            opportunities.map((obj, index) => (
                                                <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>

                                                    <Card style={{ minWidth: "100%" }} variant="outlined">
                                                        <CardContent>
                                                            {/* <span className={classes.actionsItems}> */}
                                                            {/* <VisibilityOutlined /> */}
                                                            {/* <IconButton size="small">
                                                            <Delete color="error" />
                                                        </IconButton> */}
                                                            {/* <EditOutlined /> */}
                                                            {/* </span> */}
                                                            <Link className="link" to={`${routes.opportunityDetail.path}/${obj._id}`}>
                                                                <Typography className="mb-2">{obj?.opportunityName}</Typography>
                                                            </Link>
                                                            <DisplayData label='Stage' value={obj?.stage?.optionLabel ?? ''} />
                                                            <DisplayData label='Amount' value={obj?.amount ?? ''} />
                                                            <DisplayData label='Close Date' value={displayDate(obj.closeDate)} />
                                                        </CardContent>
                                                    </Card>

                                                </Grid>
                                            ))
                                        }
                                    </Grid> : null
                            }
                        </>
                    }
                </>
            </AccordionDetails>

            <Box marginY={1} />
            <Button
                fullWidth
                variant="contained"
                color="primary"
                size="small"
                onClick={() => history.push(`/opportunity`, {
                    accountId: accountId,
                    accountName: accountName
                })}>
                View All
             </Button>
        </Accordion>

        {
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
            />
        }
    </>
}
