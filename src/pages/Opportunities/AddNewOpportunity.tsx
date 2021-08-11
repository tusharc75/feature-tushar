import React, { Fragment } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Tabs, Tab, Paper, useTheme } from "@material-ui/core";

import Layout from "../../components/Layout";
import NewOpportunityStepper from "../../components/NewOpportunityStepper";
import OpportunityNavLinks from "../../components/NavLinks";
import Container from "../../components/CustomContainer";
import TabPanel from "../../components/TabPanel";
import { OpportunityInformation, Contacts } from "../../components/Tabs";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    flexGrow: 1,
  },

  backButton: {
    marginRight: theme.spacing(1),
  },

  tabsContainer: {
    marginBottom: theme.spacing(2),
  },

  tab: {
    margin: theme.spacing(0, 2),
  },
}));

const AddNewOpportunity = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const buttonProps = [
    { title: "Save", bg: theme.palette.primary.main, color: "#fff" }, //  darkBg
    { title: "Delete", bg: theme.palette.primary.main, color: "#fff" },  //  lightBg
  ];

  return (
    <Fragment>
      <div className={classes.root}>
        <OpportunityNavLinks
          OpportunityDashboard={true}
          ButtonProps={buttonProps}
        />
        <NewOpportunityStepper />

        <Container>
          <Paper className={classes.tabsContainer} elevation={0}>
            <Tabs
              value={value}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="on"
              TabIndicatorProps={{
                style: {
                  display: "none",
                },
              }}
              textColor="primary"
            >
              {[
                "Opportunity Informatiom",
                "Contacts",
                "Activities",
                "Notes",
                "Product Line Items",
                "Price Builders",
                "Quote",
              ].map((label, i) => (
                <Tab key={i} className={classes.tab} label={label} />
              ))}
            </Tabs>
          </Paper>

          <TabPanel value={value} index={0}>
            <OpportunityInformation />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Contacts />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <OpportunityInformation />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <OpportunityInformation />
          </TabPanel>
          <TabPanel value={value} index={4}>
            <OpportunityInformation />
          </TabPanel>
          <TabPanel value={value} index={5}>
            <OpportunityInformation />
          </TabPanel>
          <TabPanel value={value} index={6}>
            <OpportunityInformation />
          </TabPanel>
        </Container>
      </div>
    </Fragment>
  );
};

export default AddNewOpportunity;
