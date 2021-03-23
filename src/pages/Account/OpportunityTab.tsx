import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import { Box } from '@material-ui/core'
import { VisibilityOutlined, EditOutlined, DeleteOutlined } from '@material-ui/icons'
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { opportunityPage } from '../../routes/Opportunity'
import { Link } from 'react-router-dom'
import { displayDate } from '../../services/util';
import { capitalize } from '../../services/util'
import './account.scss'

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(17),
        flexBasis: '33.33%',
        flexShrink: 0,

    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    box: {
        width: '48%',
        border: '1px solid grey',
        borderRadius: '15px',
        padding: '18px'
    },
    accordion: {
        display: "flex",
        justifyContent: "space-between",
        paddingTop: '15px'
    },
    actionsItems: {
        color: "grey",
        float: 'right',
    },
    accSumActive: {
        backgroundColor: "#d3d3d37a",
        color: 'black',
        border: '1px solid #00000026',
        borderRadius: '4px',
        height: '50px'
    }
}));

function DisplayData({ label, value }) {

    return (<span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography color="textSecondary" variant="subtitle1">{label}</Typography>
        <Typography noWrap>{value}</Typography>
    </span>)
}
export default function ControlledAccordions({ onChange, expanded }) {
    console.log("~ expanded", expanded)
    const classes = useStyles();

    let obj: any = {
        amount: 86000,
        closeDate: "2022-12-03",
        opportunityName: "acme widget 1200",
        probability: 33,
        stage: { optionLabel: "Needs Analysis", optionValue: "Needs Analysis", order: 2, default: false }
    }

    return (
        <div className={classes.root} >
            <Accordion expanded={expanded}>
                {/* <AccordionSummary
                    className={classes.accSumActive}
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1bh-content"
                    id="panel1bh-header"
                >
                    <Typography className={classes.heading}>Opportunity(0) </Typography>
                </AccordionSummary> */}
                <AccordionDetails className={classes.accordion}>
                    <Box className={classes.box}>

                        <span className={classes.actionsItems}>
                            <VisibilityOutlined />
                            <DeleteOutlined />
                            <EditOutlined />
                        </span>
                        <Link className="accountNameLink" to={`${opportunityPage.path}/${obj._id}`}>
                            <Typography > {capitalize(obj?.opportunityName ?? '')}</Typography>
                        </Link>
                        <DisplayData label='Stage' value={obj?.stage?.optionLabel ?? ''} />
                        <DisplayData label='Amount' value={obj?.amount ?? ''} />
                        <DisplayData label='Close Date' value={displayDate(obj.closeDate)} />
                    </Box>
                    <Box className={classes.box}>
                        <div style={{ width: '100%' }}>
                            <span className={classes.actionsItems}>
                                <VisibilityOutlined />
                                <DeleteOutlined />
                                <EditOutlined />
                            </span>
                        </div>
                        <Link className="accountNameLink" to={`${opportunityPage.path}/${obj._id}`}>
                            <Typography > {capitalize(obj?.opportunityName ?? '')}</Typography>
                        </Link>
                        <DisplayData label='Stage' value={obj?.stage?.optionLabel ?? ''} />
                        <DisplayData label='Amount' value={obj?.amount ?? ''} />
                        <DisplayData label='Close Date' value={displayDate(obj.closeDate)} />
                    </Box>
                </AccordionDetails>
            </Accordion>
        </div >
    );
}
