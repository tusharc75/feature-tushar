import React, { useState } from "react";
import { makeStyles, useTheme, withStyles } from "@material-ui/core/styles";
import {
  Box,
  Typography,
  Link,
  Divider,
  Button,
  Grid,
  Paper,
  Select,
  InputLabel,
  Checkbox,
  MenuItem,
  FormControl,
  IconButton,
  TextField,
  Switch,
  Avatar,
} from "@material-ui/core";
import { FilterList, SortByAlpha, Search } from "@material-ui/icons";
import "./style.css";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
  },
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.textDark,
  },
  linkDivider: {
    backgroundColor: theme.palette.darkBg,
    margin: "0 1rem",

    "&:last-child": {
      display: "none",
    },
  },
  headButtons: {
    display: "flex",
  },
  convertBtn: {
    textTransform: "none",
    background: theme.palette.darkBg,
    marginRight: 15,
    color: "white",
    "&:hover": {
      background: theme.palette.darkBg,
    },
  },
  saveBtn: {
    textTransform: "none",
    background: theme.palette.darkBg,
    marginRight: 15,
    color: "white",

    "&:hover": {
      background: theme.palette.darkBg,
    },
  },
  deleteBtn: {
    textTransform: "none",
    background: theme.palette.lightBg,
    color: "white",

    "&:hover": {
      background: theme.palette.lightBg,
    },
  },
  leadContainer: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  leadForm: {
    padding: "34px 22px",
    border: "1px solid #D4D6D7",
    borderRadius: 4,
  },
  profile: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(5),
  },
  information: {
    marginTop: theme.spacing(5),
  },
  inputField: {
    display: "flex",
    justifyContent: "space-between",
    marginRight: theme.spacing(12),
    marginBottom: theme.spacing(5),
  },
  inputLable: {
    flex: "0.4",
    color: theme.palette.textLight,
  },
  inputContainer: {
    flex: "0.6",
    display: "flex",
    justifyContent: "flex-end",
  },
  input: {
    width: 250,
    justifySelf: "f",
  },
  footerText: {
    textAlign: "center",
  },
}));

const NewLead = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [qualifyinTimeline, setQualifyingTimeline] = useState("");

  const onLinkClick = (event) => event.preventDefault();

  const handleChange = (event) => {
    setQualifyingTimeline(event.target.value);
  };
  return (
    <Box component="div" className={classes.root}>
      {/* Links Section */}
      <Grid container component="div" className={classes.head}>
        <Grid item>
          <Typography component="div" className={classes.linksContainer}>
            {[
              "Import from Excel",
              "Export to Excel",
              "Download Template",
              "Email a Link",
            ].map((item, i) => (
              <React.Fragment key={i}>
                <Link href="#" onClick={onLinkClick} className={classes.links}>
                  {item}
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  className={classes.linkDivider}
                />
              </React.Fragment>
            ))}
          </Typography>
        </Grid>

        <Grid item>
          <Box className={classes.headButtons}>
            <Button disableElevation className={classes.convertBtn}>
              Convert to Opportunity
            </Button>
            <Button disableElevation className={classes.saveBtn}>
              Save
            </Button>
            <Button disableElevation className={classes.deleteBtn}>
              Delete
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Form Begins Here */}
      <Paper elevation={0} className={classes.leadContainer}>
        <Box component="div" className={classes.leadForm}>
          <Typography
            variant="h5"
            style={{ color: theme.palette.textLight, textAlign: "center" }}
          >
            Create New Lead
          </Typography>

          <Box component="div" className={classes.profile}>
            <Typography style={{ marginBottom: theme.spacing(3) }}>
              Lead Image
            </Typography>
            <Avatar />
          </Box>
          <Box component="div">
            <Typography>Lead Information</Typography>
          </Box>

          <Grid container className={classes.information}>
            {/* Left Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Lead Owner
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  First Name
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Title</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Phone</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Mobile</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Qualifying Timeline
                </Typography>

                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="select-outlined-label">
                    Select Deadline
                  </InputLabel>
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
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Lead Source
                </Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="select-outlined-label">
                    Select Source
                  </InputLabel>
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
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Industry</Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="select-outlined-label">
                    Select Industry
                  </InputLabel>
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
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Revenue</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Email Opt In
                </Typography>
                <Typography component="div">
                  <Switch
                    name="checkedA"
                    inputProps={{ "aria-label": "secondary checkbox" }}
                  />
                </Typography>
              </Box>
            </Grid>

            {/* Right Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Lead Owner
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Last Name
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Email</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Fax</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Website</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Lead Status
                </Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="demo-simple-select-outlined-label">
                    Select Status
                  </InputLabel>
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
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  No. of Employees
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Rating</Typography>
                <FormControl className={classes.input} variant="outlined">
                  <InputLabel id="demo-simple-select-outlined-label">
                    Select Rating
                  </InputLabel>
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
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Skype ID</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Twitter</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="@"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Secondary Email
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box component="div">
            <Typography>Address Information</Typography>
          </Box>

          <Grid container className={classes.information}>
            {/* Left Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Street</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>State</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Country</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
            </Grid>

            {/* Right Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>City</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>Zip Code</Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box component="div">
            <Typography>Lead Description</Typography>
          </Box>

          <Grid container className={classes.information}>
            {/* Left Side Form */}
            <Grid item xs={12} md={6}>
              <Box component="div" className={classes.inputField}>
                <Typography className={classes.inputLable}>
                  Description
                </Typography>
                <Typography className={classes.inputContainer} component="div">
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="_ _ _"
                  />
                </Typography>
              </Box>
            </Grid>

            {/* Right Side Form */}
            <Grid item xs={12} md={6}></Grid>
          </Grid>
        </Box>
      </Paper>

      <Typography
        component="div"
        className={classes.footerText}
        variant="subtitle1"
        color="textSecondary"
      >
        &copy; 2020, equipt.com, Inc, or its affiliates
      </Typography>
    </Box>
  );
};

export default NewLead;
