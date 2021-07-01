import React from 'react'
import { Grid, Typography, Icon } from '@material-ui/core'
import { BiCheckShield } from 'react-icons/bi';
import { profileMenuItems } from '../../../constants/helpers'
import ManageProfile from './ManageProfile'
import styles from "../profilePage.module.scss"
import { CgProfile } from 'react-icons/cg';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { FiUsers } from 'react-icons/fi';
import { IoSettingsOutline } from 'react-icons/io5';



export default function Sidebar({ onItemClick, activeLink, userData, onFetchUserData, otherDetails, ...rest }) {
    const userMenu = [
        {
            label: "My Profile",
            show: true,
            icon: <CgProfile size={20} />,
            id: profileMenuItems.profile
        },
        {
            label: "Notification Preference",
            show: true,
            icon: <IoMdNotificationsOutline size={20} />,
            id: profileMenuItems.notification
        }
        // ,{
        //     label: "Security and Privacy",
        //     show: true,
        //     icon: <BiCheckShield size={20} />,
        //     id: profileMenuItems.securityPrivacy
        // },
        // {
        //     label: "Users",
        //     show: true,
        //     icon: <FiUsers size={20} />,
        //     id: profileMenuItems.users
        // },
        // {
        //     label: "Settings",
        //     show: true,
        //     icon: <IoSettingsOutline size={20} />,
        //     id: profileMenuItems.setting
        // },
    ]
    return <Grid container justify="center">
        <Grid item sm={12} lg={12} md={12}>
            <ManageProfile displayUserProfileImage={true} userData={userData}
                onFetchUserData={onFetchUserData} otherDetails={otherDetails}
            />
        </Grid>
        <Grid item sm={12} lg={12} md={12} className="profileBox">
            <div className="d-flex flex-column px-4 pt-2 pb-3" >
                {
                    userMenu.map((k, index) => {
                        return <div key={index} className={`font-size-3 link d-flex align-items-center gap-1 mb-3 ${styles.profileSidebarLink}`}>
                            <span className={`${styles.menuLink} ${activeLink === k.id ? styles.active : ""}`}>
                                <Icon >{k.icon}</Icon>
                                <Typography className={styles.linkLabel} align="left" key={index} onClick={() => onItemClick(k)}>{k.label} </Typography>
                            </span>
                        </div>
                    })
                }
            </div>
        </Grid>
    </Grid >
}