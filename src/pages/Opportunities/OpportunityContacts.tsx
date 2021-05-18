import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {
    Card, IconButton, CardContent, Grid,
    List, ListItem, ListItemAvatar, ListItemText, Accordion, AccordionDetails,
    AccordionSummary
} from '@material-ui/core';
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import { BiFace } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { AiOutlineMail } from 'react-icons/ai';
import CopyToClipboard from "../../components/Helpers/CopyToClipboard"

function DisplayData({ label, value, icon, showCopyToText = false }) {
    return <div style={{ flexGrow: 1 }}>
        <List>
            <ListItem>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={value} secondary={label} />
                {
                    showCopyToText ? <CopyToClipboard textToCopy={value} /> : null
                }
            </ListItem>
        </List>
    </div>
}

export default function OpportunityContacts({ contacts, title, onAddContact,
    contactApi, onSetExpanded, isExpanded, recordsPerLine }) {

    const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine)
    function ContactDetails({ contacts, contactApi, }) {
        return <>
            {
                contacts && contacts.length ? <Grid container spacing={2}>
                    {
                        [...contacts].slice(0, maxRecordsToShow).map((obj, index) => {
                            return <Grid key={index} item xs={12} sm={12} md={6}>
                                <Card>
                                    <CardContent className="detailListing">
                                        <Grid container className="detailCardHeader">
                                            <Grid item xs={12} sm={12}>
                                                <Link className="link f_size" to={`/${contactApi}/detail/${obj._id}`}>
                                                    {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                                                </Link>
                                            </Grid>
                                        </Grid>
                                        <Grid container>
                                            <Grid item xs={12} sm={12}>
                                                <DisplayData label='Title' value={obj.title || ''} icon={< BiFace size={20} />} />
                                            </Grid>
                                            <Grid item xs={12} sm={12}>
                                                <DisplayData label='Phone' value={obj.phone || ''}
                                                    icon={<AiOutlineMail size={20} />}
                                                    showCopyToText={true}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={12}>
                                                <DisplayData label='Email' value={obj.email || ''}
                                                    icon={<AiOutlineMail size={20} />}
                                                    showCopyToText={true}
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            // <Box margin={1} />
                        })
                    }
                </Grid> : <Typography className="m-2">No Contacts found</Typography>


            }
        </>
    }

    // return (
    //     <>
    //         <Card>
    //             <CardHeader
    //                 action={
    //                     <IconButton aria-label="settings" onClick={onAddContact}>
    //                         <ControlPointIcon />
    //                     </IconButton>
    //                 }
    //                 subheader={title}
    //             />
    //             <CardContent>
    //                 <ContactDetails contacts={contacts} contactApi={contactApi} />
    //             </CardContent>
    //         </Card>

    //     </>
    // )
    return <Accordion expanded={isExpanded}>
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
            contacts && contacts.length > 2 ? <>
                <Box margin={1} className="btn-view gap-1" p={1} display="flex" justifyContent="center"
                    alignItems="center"
                    onClick={() => setMaxRecordsToShow(contacts.length)}>
                    <FaEye /> View All
                </Box>
                <Box margin={1} />
            </> : null
        }
    </Accordion>

}
