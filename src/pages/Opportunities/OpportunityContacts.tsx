import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {
    Card, IconButton, CardContent, Grid,
    List, ListItem, ListItemAvatar, ListItemText,
    withStyles
} from '@material-ui/core';
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { AiOutlineAccountBook, AiOutlineMail, AiOutlineUser } from 'react-icons/ai';
import CopyToClipboard from "../../components/Helpers/CopyToClipboard";
import { BiPhone } from 'react-icons/bi';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { supplierAccount, supplierContact } from '../../constants/helpers';

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

function DisplayData({ key, label, value, icon, showCopyToText = false }) {
    return <div style={{ flexGrow: 1 }}>
        <List>
            <ListItem key={key}>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={value ? value : '-'} secondary={label} />
                {
                    showCopyToText ? <CopyToClipboard textToCopy={value} /> : null
                }
            </ListItem>
        </List>
    </div>
}
export default function OpportunityContacts({ contacts, title, onAddContact,
    contactApi, onSetExpanded, isExpanded, recordsPerLine, accounts = null }) {

    const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine)
    function ContactDetails({ contacts, contactApi, }) {
        return <>
            {
                contacts && contacts.length ? <Grid container spacing={2}>
                    {
                        [...contacts].slice(0, maxRecordsToShow).map((obj, index) => {
                            return <Grid key={index} item xs={12} sm={6} md={4}>
                                <Card className="detailCard">
                                    <CardContent className="detailListing">
                                        <Grid container className="detailCardHeader">
                                            <Grid item xs={12} sm={12}>
                                                {
                                                    <Link className="link" to={`/${contactApi}/detail/${obj._id}`}>
                                                        <Typography className="detailName"> {`${obj.firstName || ''}  ${obj.lastName || ''}`}{obj.title && <span className="role">( {obj.title} )</span>}</Typography>
                                                    </Link>
                                                }
                                            </Grid>
                                        </Grid>
                                        <Grid container>
                                            <Grid item xs={12} sm={6} md={6}>
                                                {
                                                    <DisplayData key="2" label='Email' showCopyToText={true} icon={<AiOutlineMail size={15} />} value={obj.email || ''} />
                                                }
                                            </Grid>
                                            {(supplierContact.contactApi === contactApi) && <Grid item xs={12} sm={6} md={6}>
                                                {<Link className="link" to={`/${supplierAccount.accountApi}/detail/${obj.accountName}`}>
                                                    <DisplayData key="2" label='Supplier Account' showCopyToText={true} icon={<AiOutlineUser size={15} />} value={accounts.find(item => item.optionValue === obj.accountName).optionLabel || ''} />
                                                </Link>

                                                }
                                            </Grid>}
                                            <Grid item xs={12} sm={6} md={6}>
                                                {
                                                    <DisplayData key="3" label='Phone' showCopyToText={true} icon={<BiPhone size={15} />} value={obj.phone || ''} />
                                                }
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        })
                    }
                </Grid> : <Typography className="m-2">No Contacts found</Typography>
            }
        </>
    }
    return <Accordion expanded={isExpanded} className="omsAccordian accordOpportunity">
        <AccordionSummary aria-controls="user-panel-content"
            id="user-panel-header"
        >
            <Grid container>
                <Grid item xs={8}>
                    <Box display="flex">
                        <Box>
                            <IconButton
                                size="small"
                                onClick={onSetExpanded} >
                                {
                                    isExpanded === true ? (
                                        <ExpandLessIcon />
                                    ) : (
                                        <ExpandMoreIcon />
                                    )
                                }
                            </IconButton>
                        </Box>
                        <Box padding="5px">
                            <Typography variant="subtitle2">
                                {title} {contacts && contacts.length > 0 ? `(${contacts.length})` : ''}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={4} container justify="flex-end">
                    <IconButton
                        color="primary"
                        size="small"
                        onClick={onAddContact}
                    >
                        <ControlPointIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </AccordionSummary>
        <Box margin={0.50} />
        <AccordionDetails>
            <ContactDetails contacts={contacts} contactApi={contactApi} />
        </AccordionDetails>
        {
            contacts && contacts.length > maxRecordsToShow ? <>
                <Box margin={1} className="btn-view gap-1" p={1} display="flex" justifyContent="center"
                    alignItems="center"
                    onClick={() => setMaxRecordsToShow(prevState => prevState + (recordsPerLine * 2))}>
                    <FaArrowAltCircleDown size={25} />
                </Box>
            </> : null
        }
    </Accordion>

}
