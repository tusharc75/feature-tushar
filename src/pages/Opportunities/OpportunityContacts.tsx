import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Card, CardHeader, IconButton, CardContent, Grid, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core';
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import axiosInstance from '../../axios/axiosInstance';
import { BiFace } from 'react-icons/bi';
import { BsPerson } from 'react-icons/bs';
import { FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom'

function DisplayData({ label, value, icon }) {
    return <div style={{ flexGrow: 1 }}>
        <List>
            <ListItem>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={value} secondary={label} />
            </ListItem>
        </List>
    </div>
}

export default function OpportunityContacts({ contacts, title, onAddContact, contactApi }) {

    function ContactDetails({ contacts, contactApi, }) {
        return <>
            {
                contacts && contacts.length ? <Grid container spacing={2}>
                    {
                        contacts.map((obj, index) => {
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
                                            <Grid item xs={12} sm={6}>
                                                {
                                                    <DisplayData label='Title' value={obj.title || ''} icon={< BiFace size={20} />} />
                                                }

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

    return (
        <>
            <Card>
                <CardHeader
                    action={
                        <IconButton aria-label="settings" onClick={onAddContact}>
                            <ControlPointIcon />
                        </IconButton>
                    }
                    subheader={title}
                />
                <CardContent>
                    <ContactDetails contacts={contacts} contactApi={contactApi} />
                </CardContent>
            </Card>

        </>
    )
}
