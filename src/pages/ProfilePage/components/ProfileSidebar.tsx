import { Typography, Icon } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { profileMenuItems } from '../../../constants/helpers';
import ManageProfile from './ManageProfile';
import styles from '../profilePage.module.scss';
import { CgProfile } from 'react-icons/cg';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { IoSettingsOutline } from 'react-icons/io5';

export default function Sidebar({ onItemClick, activeLink, userData, onFetchUserData, otherDetails, ...rest }) {
  const userMenu = [
    {
      label: 'My Profile',
      show: true,
      icon: <CgProfile size={20} />,
      id: profileMenuItems.profile
    },
    {
      label: 'Notification Preference',
      show: true,
      icon: <IoMdNotificationsOutline size={20} />,
      id: profileMenuItems.notification
    },
    {
      label: 'UI Preference',
      show: true,
      icon: <IoSettingsOutline size={20} />,
      id: profileMenuItems.uiPreference
    }
  ];

  return (
    <Grid container justifyContent="center">
      <Grid size={{sm:12, lg:12, md:12}}>
        <ManageProfile displayUserProfileImage={true} userData={userData} onFetchUserData={onFetchUserData} otherDetails={otherDetails} />
      </Grid>
      <Grid size={{sm:12, lg:12, md:12}} className="profileBox">
        <div className="d-flex flex-column px-4 pb-3 pt-2">
          {userMenu.map((k, index) => {
            return (
              <div key={index} className={`font-size-3 link d-flex align-items-center mb-3 gap-1 ${styles.profileSidebarLink}`}>
                <span className={`${styles.menuLink} ${activeLink === k.id ? styles.active : ''}`}>
                  <Icon>{k.icon}</Icon>
                  <Typography className={styles.linkLabel} align="left" key={index} onClick={() => onItemClick(k)}>
                    {k.label}{' '}
                  </Typography>
                </span>
              </div>
            );
          })}
        </div>
      </Grid>
    </Grid>
  );
}
