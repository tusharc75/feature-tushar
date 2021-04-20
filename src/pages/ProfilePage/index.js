import React, { useState } from 'react'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import Layout from "../../components/Layout";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import "./profilePage.scss"
import ProfileSidebar from './ProfileSidebar'
import { profileMenuItems } from '../../constants/helpers'
import ManageProfile from './ManageProfile'

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
        whiteSpace: 'nowrap',
        marginBottom: theme.spacing(1),
    },
    profileContainer: {
        width: '90%',
        height: '80%',
        margin: '50px',
        borderRadius: '8px',
        textAlign: 'center',
        backgroundColor: theme.palette.common.white,
    },
    profileSidebar: {
        borderRight: `2px solid ${theme.palette.primary.light}`
    }
}));
export default function ProfilePage(props) {

    const { profileBreadCrumbs } = props
    const [activeItem, setActiveItem] = useState(profileMenuItems.profile)
    const classes = useStyles();

    const handleItemClick = obj => {
        if (obj.id) setActiveItem(obj.id)
    }

    return <Layout>
        <CustomBreadCrumbs routes={[profileBreadCrumbs]} />
        <Grid container className={classes.profileContainer} spacing="2">
            <Grid item sm={3} lg={3} md={3} className={classes.profileSidebar} >
                <ProfileSidebar onItemClick={handleItemClick} />
            </Grid>
            <Grid item sm={6} md={6} lg={9} >
                {
                    activeItem === profileMenuItems.profile ?
                        <ManageProfile displayUserDetails={true} /> :
                        activeItem === profileMenuItems.notification ?
                            <Paper className={classes.paper}>notifications</Paper>
                            : activeItem === profileMenuItems.setting ?
                                <Paper className={classes.paper}>setting</Paper>
                                : activeItem === profileMenuItems.users ?
                                    <Paper className={classes.paper}>users</Paper>
                                    : activeItem === profileMenuItems.securityPrivacy ?
                                        <Paper className={classes.paper}>securityPrivacy</Paper> : null
                }
            </Grid>
        </Grid>
    </Layout >
}
