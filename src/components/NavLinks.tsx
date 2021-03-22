import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Link, Box, Button, Divider } from "@material-ui/core";
import PropTypes from 'prop-types'

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.primary.main,  //  textDark
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  linkDivider: {
    backgroundColor: theme.palette.primary.main,  //  darkBg
    margin: "0 1rem",
  },
  headButtons: {
    display: "flex",
    justifyContent: "flex-end",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  button: {
    "&:hover": {
      background: theme.palette.primary.main, //  darkBg
    },
    "&:first-child": {
      marginRight: 15,

      [theme.breakpoints.down("sm")]: {
        marginRight: 0,
      },
    },
    "&:last-child": {
      [theme.breakpoints.down("sm")]: {
        marginLeft: "0 !important",
      },
    },
    [theme.breakpoints.down("sm")]: {
      marginBottom: 15,
    },
  },
}));

const OpportunityNavLinks = ({ OpportunityDashboard, ButtonProps }) => {
  const classes = useStyles();

  const buttonActions = (action) => {
    switch (action) {
      case "Save": {
        alert("Save Button Clicked");
        break;
      }

      case "Delete": {
        alert("Delete Button Clicked");
        break;
      }

      default:
        return;
    }
  };

  return (
    <div className={classes.root}>
      {/* Links Section */}
      <Grid
        container
        // className={classes.head}
        justify="space-between"
        alignItems="center"
      >
        <Grid item xs={12} sm={12} md={OpportunityDashboard ? 9 : 7}>
          <Box component="div" className={classes.linksContainer}>
            {OpportunityDashboard && (
              <>
                <Link
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={classes.links}
                >
                  Opportunities Dashboard
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  className={classes.linkDivider}
                />
              </>
            )}
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Import from Excel
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Export to Excel
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Download Template
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Email a Link
            </Link>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={OpportunityDashboard ? 3 : 5}>
          <Box className={classes.headButtons}>
            {ButtonProps &&
              ButtonProps.map((btn, i) => (
                <Button
                  key={i}
                  className={classes.button}
                  disableElevation
                  style={{
                    backgroundColor: btn.bg,
                    color: btn.color,
                    marginLeft: i === 2 ? 15 : 0,
                  }}
                  onClick={() => buttonActions(btn.title)}
                >
                  {btn.title}
                </Button>
              ))}
          </Box>
        </Grid>
      </Grid>
    </div>
  );
};

OpportunityNavLinks.propTypes = {
  OpportunityDashboard: PropTypes.any,
  ButtonProps: PropTypes.any
}

export default OpportunityNavLinks;
