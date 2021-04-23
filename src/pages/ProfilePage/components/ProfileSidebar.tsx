import React from 'react'
import { Grid, Typography, Icon } from '@material-ui/core'
import { BsShieldShaded, BsFillGearFill } from 'react-icons/bs'
import { HiSpeakerphone, HiUserCircle, HiUsers } from 'react-icons/hi'
import { profileMenuItems } from '../../../constants/helpers'
import ManageProfile from './ManageProfile'
import styles from "../profilePage.module.scss"

export default function Sidebar({ onItemClick, activeLink, userData, ...rest }) {
    const userMenu = [
        {
            label: "My Profile",
            show: true,
            icon: <HiUserCircle />,
            id: profileMenuItems.profile
        },
        {
            label: "Notification Preference",
            show: true,
            icon: <HiSpeakerphone />,
            id: profileMenuItems.notification
        },
        {
            label: "Security and Privacy",
            show: true,
            icon: <BsShieldShaded />,
            id: profileMenuItems.securityPrivacy
        },
        {
            label: "Users",
            show: true,
            icon: <HiUsers />,
            id: profileMenuItems.users
        },
        {
            label: "Setting",
            show: true,
            icon: <BsFillGearFill />,
            id: profileMenuItems.setting
        },
    ]
    return <Grid container spacing={4} >
        <ManageProfile displayUserProfileImage={true} userData={userData} />
        <Grid item sm={12} lg={12} md={12}>
            <div className="d-flex flex-column gap-4 px-4 pt-2 pb-3" >
                {
                    userMenu.map((k, index) => {
                        return <div key={index} className={`font-size-3 link d-flex justify-content-center align-items-center gap-1 ${styles.profileSidebarLink}`}>
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
