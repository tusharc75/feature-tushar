import React from 'react'
import { Link } from 'react-router-dom'
import { Box, Card, CardContent, Grid, List, Typography } from '@material-ui/core'
import { makeStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes'
import accountClass from "./account.module.scss"
import { Button } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { BsPerson } from 'react-icons/bs';
import { BiFace } from 'react-icons/bi';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { ListItemText } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
        flexGrow: 1,
    },
    div1: {
        display: 'flex',
        // justifyContent: 'space-between'
    },
    span: {
        width: '50%'
    }
}));

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

function RelatedContacts({ contacts, accountId, accountName, contactApi, contactRoute }) {

    const classes = useStyles();
    const history = useHistory();

    return <>
        {
            contacts && contacts.length ? <>
                {
                    contacts.map((obj, index) => {
                        return <>
                            <Card key={index}>
                                <CardContent className="detailListing">
                                    <Grid container className="detailCardHeader">
                                        <Grid item xs={12} sm={12}>
                                            <Link className={`${accountClass.account_name_link} f_size`}
                                                to={`/${contactApi}/detail/${obj._id}`}>
                                                {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                                            </Link>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12} sm={6}>
                                            {
                                                accountName ? <DisplayData label='Account' value={accountName} icon={<BsPerson size={20} />} /> : ''
                                            }
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            {
                                                obj?.title ? <DisplayData label='Title' value={obj.title || ''} icon={< BiFace size={20} />} /> : ''
                                            }

                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                            <Box margin={1} />
                        </>
                    })
                }
                <Box margin={1} />
                <Box className="btn-view gap-1" p={1} display="flex" justifyContent="center" alignItems="center"
                    onClick={() => history.push(`/${contactRoute}`, {
                        accountId: accountId,
                        accountName: accountName
                    })}>
                    <FaEye /> View All &#8599;
                </Box>
            </> : null
        }
    </>
}
export default RelatedContacts
