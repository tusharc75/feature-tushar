import { Box, Typography, Theme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import { BsEnvelopeOpen, BsDisplay } from 'react-icons/bs';
import styles from '../profilePage.module.scss';
import ResourceWiseNotificationPreference from 'src/pages/ProfilePage/components/ResourceWiseNotificationPreference';

const useStyles = makeStyles((theme: Theme) => ({
  tableCell: {
    fontSize: 'medium'
  },
  notificationIcon: {
    color: theme.palette.primary.light
  },
  preferenceOptions: {
    color: 'primary',
    marginBottom: '12px',
    marginLeft: '5px'
  },
  label: {
    marginLeft: '1px'
  }
}));

const PreferenceOptions = ({ id, icon, heading, subtitle }) => (
  <Grid key={id} size={{ sm: 12, md: 6, lg: 6 }} >
    <Grid size={{ sm: 2, md: 2, lg: 2 }} style={{ marginTop: '7px' }}>
      {icon}
    </Grid>
    <Grid size={{ sm: 9, md: 9, lg: 9 }} >
      <Typography variant="h6">
        <strong>{heading}</strong>
      </Typography>
      <Typography variant="body2" >
        {subtitle}
      </Typography>
    </Grid>
  </Grid >
);

export default function NotificationPreference({ notificationPreferenceData, user, onSuccess }) {
  const classes = useStyles();

  const options = [
    {
      icon: <BsDisplay size={60} className={classes.notificationIcon} />,
      heading: 'Portal',
      subtitle: 'A banner in corner of your website',
      id: 'Portal'
    },
    {
      icon: <BsEnvelopeOpen size={50} className={classes.notificationIcon} />,
      heading: 'Email',
      subtitle: 'Conversation sent to your mail',
      id: 'Email3'
    }
  ];

  return (
    <>
      <div className={styles.preferenceHeader}>
        <Typography variant="h5">Your Notification Preference</Typography>
      </div>
      <Box style={{ padding: '8px' }}>
        <Box className={styles.preferenceOptionsBox}>
          <Grid container spacing={3} className={classes.preferenceOptions}>
            {options.map((curPreference) => (
              <PreferenceOptions
                key={curPreference.id}
                id={curPreference.id}
                icon={curPreference.icon}
                heading={curPreference.heading}
                subtitle={curPreference.subtitle}
              />
            ))}
          </Grid>
        </Box>
        <ResourceWiseNotificationPreference />
      </Box>
    </>
  );
}
