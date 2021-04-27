import React, { useState, useEffect, useContext } from 'react'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import Layout from "../../components/Layout";
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ProfileSidebar from './components/ProfileSidebar'
import { profileMenuItems } from '../../constants/helpers'
import ManageProfile from './components/ManageProfile'
import NotifiationPreference from './components/NotifiationPreference'
import axiosInstance from "../../axios/axiosInstance";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
const _ = require('lodash')

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
        margin: theme.spacing(4),
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
    const { state: { user }, dispatch }: any = useData();
    const [activeItem, setActiveItem] = useState(profileMenuItems.profile)
    const [userData, setUserData] = useState(null)
    const [otherDetails, setOtherDetails] = useState(null)
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [userFields, setUserFields] = useState([]);
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);

    const handleItemClick = obj => {
        if (obj.id) setActiveItem(obj.id)
    }

    useEffect(() => {
        if (userFields.length == 0) {
            getUserFields()
            fetchUserData()
        }
    }, [])

    const fetchUserData = () => {
        setUserLoading(true)
        axiosInstance()
            .get(`/user/me`)
            .then(({ data }) => {
                let { user } = data.data
                if (user) {
                    setOtherDetails({
                        Email: user?.email ?? '',
                        EmployeeNumber: user?.employeeNumber ?? ''
                    })
                    Object.keys(user).forEach(k => {
                        if (["blocked", "updatedBy", "email", "employeeNumber"].indexOf(user[k]) > 0) {
                            delete user[k]
                        }
                    })

                    setUserData(user)
                }
                setUserLoading(false)
            }).catch((error) => {
                setUserLoading(false)
                toastConfig.setToastConfig(error);
            });
    }

    const getUserFields = () => {

        setLoading(true)
        axiosInstance()
            .get("/field?resource=User")
            .then(({ data }) => {
                data.data = data.data && data.data.length ? data.data.filter(field => ["blocked", "email", "employeeNumber"].indexOf(field?.fieldData?.fieldName) < 0) : []
                setUserFields(data.data)
                setLoading(false)
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setLoading(false)
            });
    };

    return <Layout>
        <CustomBreadCrumbs routes={[profileBreadCrumbs]} />
        <Grid container className={classes.profileContainer} spacing={2}>
            <Grid item sm={3} lg={3} md={3} className={classes.profileSidebar} >
                <ProfileSidebar onItemClick={handleItemClick}
                    activeLink={activeItem}
                    userData={userData}
                    onFetchUserData={fetchUserData}
                />
            </Grid>
            <Grid item sm={9} md={9} lg={9} >
                {
                    activeItem === profileMenuItems.profile ?
                        <ManageProfile displayUserDetails={true}
                            userFields={userFields}
                            userData={userData}
                            loading={loading}
                            userLoading={userLoading}
                            onFetchUserData={fetchUserData}
                            otherDetails={otherDetails}
                        /> :
                        activeItem === profileMenuItems.notification ?
                            <NotifiationPreference />
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