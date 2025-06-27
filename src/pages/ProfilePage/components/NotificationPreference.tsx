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
  <Grid key={id} size={{ sm: 12, md: 6, lg: 4 }} container>
    <Grid size={{ sm: 3 }} style={{ marginTop: '7px' }}>
      {icon}
    </Grid>
    <Grid size={{ sm: 7 }} container>
      <Grid size={{ xs: 12, sm: 7 }} container direction="column">
        <Grid size={{ xs: 12, sm: 7 }} container>
          <Typography align="left" variant="h6">
            <strong>{heading}</strong>
          </Typography>
          <Typography align="left" variant="body2" gutterBottom>
            {subtitle}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
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
