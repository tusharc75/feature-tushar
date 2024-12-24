import React, { useState, Fragment } from 'react';
import { makeStyles, useTheme } from '@mui/styles';
import { Box, Typography, Grid, Select, InputLabel, MenuItem, FormControl, TextField, Switch, Avatar } from '@mui/material';
import './style.scss';
import Container from '../../components/CustomContainer';
import BoxWithBorder from '../../components/BoxWithBorder';
import NavLinks from '../../components/NavLinks';
import { Image } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  profile: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(5)
  },
  informationText: {
    marginTop: theme.spacing(5)
  },
  inputField: {
    display: 'flex',
    justifyContent: 'space-between',
    marginRight: theme.spacing(12),
    marginBottom: theme.spacing(5),
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      marginRight: theme.spacing(5),
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    [theme.breakpoints.down('md')]: {
      marginRight: theme.spacing(5)
    }
  },
  inputLable: {
    flex: '0.4',
    color: theme.palette.primary.main //  textLight
  },
  inputContainer: {
    flex: '0.6',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  input: {
    width: 250,
    [theme.breakpoints.down('xs')]: {
      marginTop: theme.spacing(2),
      width: '100%'
    }
  },
  footerText: {
    textAlign: 'center'
  }
}));

const NewLead = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [qualifyinTimeline, setQualifyingTimeline] = useState('');

  const handleChange = (event) => {
    setQualifyingTimeline(event.target.value);
  };

  const buttonProps = [
    {
      title: 'Convert to Opportunity',
      bg: theme.palette.primary.main, //  darkBg
      color: '#fff'
    },
    { title: 'Save', bg: theme.palette.primary.main, color: '#fff' }, //  darkBg
    { title: 'Delete', bg: theme.palette.primary.main, color: '#fff' } //  darkBg
  ];
  return (
    <Fragment>
      {/* Links Section */}
      <NavLinks ButtonProps={buttonProps} />

      {/* Form Begins Here */}
      <Container>
        <BoxWithBorder>
          <Typography
            variant="h5"
            style={{ color: theme.palette.primary.main, textAlign: 'center' }} //  textLight
          >
            Create New Lead
          </Typography>
          <Box component="div" className={classes.profile}>
            <Typography style={{ marginBottom: theme.spacing(3) }}>Lead Image</Typography>
            <Avatar>
              <Image style={{ fontSize: 24 }} />
            </Avatar>
          </Box>
          <Box component="div">
            <Typography>Lead Information</Typography>
          </Box>
          <Grid container className={classes.informationText}>
            {/* Left Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Lead Owner</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* First Name */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>First Name</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Title */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Title</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Phone */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Phone</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Mobile */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Mobile</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Qualifying Timeline */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Qualifying Timeline</Typography>

                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="select-outlined-label">Select Deadline</InputLabel>
                  <Select
                    labelId="select-outlined-label"
                    id="select-outlined"
                    value={qualifyinTimeline}
                    onChange={handleChange}
                    label="Select Deadline"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Lead Source */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Lead Source</Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="select-outlined-label">Select Source</InputLabel>
                  <Select
                    labelId="select-outlined-label"
                    id="select-outlined"
                    value={qualifyinTimeline}
                    onChange={handleChange}
                    label="Select Source"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Select Industry */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Industry</Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="select-outlined-label">Select Industry</InputLabel>
                  <Select
                    labelId="select-outlined-label"
                    id="select-outlined"
                    value={qualifyinTimeline}
                    onChange={handleChange}
                    label="Select Source"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Revenue */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Revenue</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Email Opt In */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Email Opt In</Typography>
                <Typography component="div">
                  <Switch name="checkedA" inputProps={{ 'aria-label': 'secondary checkbox' }} />
                </Typography>
              </Box>
            </Grid>

            {/* Right Side Form */}
            <Grid item xs={12} md={6}>
              {/* Company */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Company</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Last Name */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Last Name</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Email */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Email</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Fax */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Fax</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Website */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Website</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Lead Status */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Lead Status</Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="demo-simple-select-outlined-label">Select Status</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    value={qualifyinTimeline}
                    onChange={handleChange}
                    label="Age"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* No of Employees */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>No. of Employees</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Rating */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Rating</Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="demo-simple-select-outlined-label">Select Rating</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    value={qualifyinTimeline}
                    onChange={handleChange}
                    label="Age"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Skype ID */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Skype ID</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>

              {/* Twitter */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Twitter</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="@" />
                </Typography>
              </Box>

              {/* Secondary Email */}
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Secondary Email</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>
            </Grid>
          </Grid>
          {/* Address Information */}
          <Box component="div">
            <Typography>Address Information</Typography>
          </Box>
          <Grid container className={classes.informationText}>
            {/* Left Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Street</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>State</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Country</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>
            </Grid>

            {/* Right Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>City</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Zip Code</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Lead Description */}
          <Box component="div">
            <Typography>Lead Description</Typography>
          </Box>
          <Grid container className={classes.informationText}>
            {/* Left Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Description</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField className={classes.input} variant="outlined" multiline rows={4} placeholder="_ _ _" />
                </Typography>
              </Box>
            </Grid>

            {/* Right Side Form */}
            <Grid item xs={12} md={6}></Grid>
          </Grid>
        </BoxWithBorder>
      </Container>

      <Typography component="div" className={classes.footerText} variant="subtitle1" color="textSecondary">
        &copy; 2020, equipt.com, Inc, or its affiliates
      </Typography>
    </Fragment>
  );
};

export default NewLead;
