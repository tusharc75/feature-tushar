import { useContext, useState } from 'react';
import { Grid, Box, Checkbox, FormControlLabel, Typography, Button, CircularProgress, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { BsEnvelopeOpen, BsDisplay } from 'react-icons/bs';
import styles from '../profilePage.module.scss';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';

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

const RenderCheckBox = ({ name, val, id, onChange, isDisable }) => (
  // <FormControlLabel
  //     control={<Checkbox size="small" checked={val}
  //         onChange={(e) => onChange(e.target.checked, id, name)} name={name} />}
  //     label={name}
  // />
  <Checkbox disabled={isDisable} checked={val} onChange={(e) => onChange(e.target.checked, id, name)} name={name} />
);

const PreferenceOptions = ({ id, icon, heading, subtitle }) => (
  <Grid item key={id} sm={12} md={6} lg={4} container>
    <Grid item sm={3} style={{ marginTop: '7px' }}>
      {icon}
    </Grid>
    <Grid item sm={7} container>
      <Grid item xs container direction="column">
        <Grid item xs>
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
  const toastConfig = useContext(CustomToastContext);
  const [rows, setRows] = useState(notificationPreferenceData);
  const [isUpdating, setUpdating] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isAllPreference, setAllPreference] = useState({
    portal: notificationPreferenceData.every((d) => d.portal),
    email: notificationPreferenceData.every((d) => d.email)
  });
  const classes = useStyles();
  const handleChange = (isChecked, id, columnName) => {
    let tempRows = rows.map((obj) => {
      if (obj.id === id) return { ...obj, [columnName]: isChecked };
      else return obj;
    });
    setAllPreference({
      portal: tempRows.every((d) => d.portal),
      email: tempRows.every((d) => d.email)
    });
    setRows(tempRows);
  };

  const handleSelectAll = (columnName) => {
    setAllPreference((prevState) => {
      return {
        ...prevState,
        [columnName]: !prevState[columnName]
      };
    });
    let tempRows = rows.map((obj) => {
      return { ...obj, [columnName]: !isAllPreference[columnName] };
    });
    setRows(tempRows);
  };

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

  const updateNotificationPref = () => {
    setUpdating(true);
    let dataObj = {
      _id: user,
      notificationPref: rows
    };
    axiosInstance()
      .put(`/user/notification`, dataObj)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
        setUpdating(false);
        setIsEdit(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

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
        <div className="header-panel">
          <div className="flex flex-wrap justify-end gap-[8px]">
            {isEdit && (
              <Button
                disabled={isUpdating}
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  updateNotificationPref();
                }}
              >
                {isUpdating && <CircularProgress size={22} />}
                Update
              </Button>
            )}
            {!isEdit && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  setIsEdit(!isEdit);
                }}
              >
                {isUpdating && <CircularProgress size={22} />}
                Edit
              </Button>
            )}
          </div>
        </div>
        <TableContainer component={Paper}>
          <Table>
            <TableRow>
              <TableCell component="th" scope="row" className={classes.tableCell}></TableCell>
              <TableCell padding="checkbox">
                <FormControlLabel
                  className={classes.label}
                  control={<Checkbox checked={isAllPreference.portal} disabled={!isEdit} onChange={() => handleSelectAll('portal')} title="Portal" />}
                  label="Portal"
                />
              </TableCell>
              <TableCell padding="checkbox">
                <FormControlLabel
                  className={classes.label}
                  control={<Checkbox checked={isAllPreference.email} disabled={!isEdit} onChange={() => handleSelectAll('email')} title="Email" />}
                  label="Email"
                />
              </TableCell>
            </TableRow>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row?.id}>
                  <TableCell component="th" scope="row" className={classes.tableCell}>
                    {row.name}
                  </TableCell>
                  <TableCell padding="checkbox">
                    <RenderCheckBox name="portal" val={row.portal} id={row.id} onChange={handleChange} isDisable={!isEdit} />
                  </TableCell>
                  <TableCell padding="checkbox">
                    <RenderCheckBox name="email" val={row.email} onChange={handleChange} id={row.id} isDisable={!isEdit} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
