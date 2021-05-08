import { useContext, useEffect, useState } from "react";
import clsx from "clsx";
import {
  withStyles,
  Grid,
  Typography,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails,
  makeStyles,
  Paper,
  Box,
  IconButton,
  Tabs,
  Tab,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Add, ExpandMore, ControlPoint } from "@material-ui/icons";

import axiosInstance from "../../axios/axiosInstance";
import CustomerContacts from "./CustomerContacts";
import BoxWithBorder from "../../components/BoxWithBorder";
import OpportunityAccordianProjectSales from "./OpportunityAccordingProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ProjectInAccordion from "../../components/ProjectInAccordion/ProjectInAccordion";
import QuotesInAccordion from "../../components/QuotesInAccordion/QuotesInAccordion";
import ProductBuilderInAccordion from "../../components/ProductBuilderInAccordion/ProductBuilderInAccordion";

const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
    boxShadow: "none",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, .03)",
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    marginBottom: -1,
    minHeight: 46,
    "&$expanded": {
      minHeight: 46,
    },
  },
  content: {
    "&$expanded": {
      margin: "12px 0",
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: "#fff",
  },
}))(MuiAccordionDetails);

const useStyles = makeStyles((theme) => ({
  root: {
    background: "#FFF",
    marginBottom: 12,
  },
  expand: {
    transform: "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.standard,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
  addBtn: {
    marginLeft: "auto",
  },
}));

const CustomerStrategy = (props) => {
  const {
    loading,
    handleOpenDialog,
    customerAccounts,
    opportunities,
    permissions,
    fetchProjectData,
    customerContacts,
    projectId,
    users,
    isTeamMember,
    isManager,
  } = props;
  const classes = useStyles();
  const { setToastConfig } = useContext(CustomToastContext);
  const [expandedParent, setExpandedParent] = useState(true);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    if (!users.length) return;

    const collabs = users.map((u, i) => ({
      optionValue: u._id,
      optionLabel: u.firstName + " " + u.lastName,
      order: i,
      default: false,
    }));
    setCollaborators(collabs);
  }, [users]);

  /**
   *  Save opportunity data in project sales
   * @param id
   */
  const saveOppToProject = async (id) => {
    const existingData = opportunities.map((o) => o._id);

    const dataObj = {
      opportunity: [id, ...existingData],
      _id: projectId,
    };

    await axiosInstance()
      .put(`/project-sales/add-opportunity`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Opportunity added successfully`,
          type: "success",
          open: true,
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  return (
    <Paper className={classes.root}>
      <Accordion
        square={false}
        expanded={expandedParent}
        onChange={() => setExpandedParent(!expandedParent)}
      >
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          <Box
            display="flex"
            alignItems="center"
            className={clsx(classes.expand, {
              [classes.expandOpen]: expandedParent,
            })}
          >
            <ExpandMore />
          </Box>
          <Box component="span" mx={1} />
          <Typography variant="subtitle1">Customer Accounts</Typography>
          {(permissions.isUpdate && isTeamMember) || isManager ? (
            <IconButton
              color="primary"
              size="small"
              className={classes.addBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog("customer-account");
              }}
            >
              <Add />
            </IconButton>
          ) : null}
        </AccordionSummary>
        <AccordionDetails>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : customerAccounts.length ? (
            <Box width="100%">
              <>
                <Tabs
                  variant="scrollable"
                  scrollButtons="auto"
                  className="oms-tab"
                  value={currentTabIndex}
                  onChange={(index, newValue) => {
                    setCurrentTabIndex(newValue);
                  }}
                  indicatorColor="primary"
                  textColor="primary"
                  aria-label="icon tabs example"
                >
                  {customerAccounts.map((c, i) => (
                    <Tab
                      key={i}
                      tabIndex={i}
                      label={c.accountName}
                      aria-controls={`a11y-tabpanel-${i}`}
                      id={`a11y-tab-${i}`}
                    />
                  ))}
                </Tabs>

                {customerAccounts.map((c, i) => (
                  <Box mt={2} hidden={currentTabIndex !== i} key={c._id}>
                    <Grid container spacing={1}>
                      {/**
                       * LEFT SIDE
                       */}

                      <Grid item xs={12} sm={12} md={8} lg={8}>
                        {/*TODO: Heirarchy Table */}
                        {permissions?.isRead && (
                          <OpportunityAccordianProjectSales
                            opportunities={opportunities.filter(
                              (o) => o.customerAccountName === c._id
                            )}
                            onNewOpportunityAdd={(id) => {
                              saveOppToProject(id);
                            }}
                            permissions={permissions}
                            accountId={c._id}
                            accountName={c.accountName}
                            resource={"customerAccount"}
                            isRedirect={false}
                            expanded={true}
                            collaborators={collaborators}
                            projectId={projectId}
                            addExisting={handleOpenDialog}
                            fetchProjectData={fetchProjectData}
                            isTeamMember={isTeamMember}
                            isManager={isManager}
                          />
                        )}
                        <QuotesInAccordion />
                        <ProjectInAccordion />
                        <ProductBuilderInAccordion />
                      </Grid>
                      {/**
                       * RIGHT SIDE
                       */}
                      <Grid item xs={12} sm={12} md={4} lg={4}>
                        <Paper style={{ overflow: "hidden" }}>
                          <Box style={{ padding: "0px", maxHeight: "450px" }}>
                            <Box
                              width="100%"
                              padding={1}
                              bgcolor="grey.200"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Typography variant="subtitle2">
                                Customer Contacts
                              </Typography>
                              {(permissions.isUpdate && isTeamMember) ||
                              isManager ? (
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() =>
                                    handleOpenDialog("customer-contact", c._id)
                                  }
                                >
                                  <ControlPoint />
                                </IconButton>
                              ) : null}
                            </Box>
                            <Box padding={1}>
                              {loading ? (
                                [1, 2].map((i) => (
                                  <BoxWithBorder
                                    key={i}
                                    style={{ marginBottom: "8px" }}
                                  >
                                    <Box padding={1}>
                                      <Skeleton
                                        variant="text"
                                        width="100px"
                                        height="20px"
                                      />
                                      <Box marginTop={1} />
                                      <Skeleton
                                        variant="text"
                                        width="100%"
                                        height="15px"
                                      />
                                    </Box>
                                  </BoxWithBorder>
                                ))
                              ) : customerContacts.filter(
                                  (cA) => cA.accountName === c._id
                                ).length ? (
                                <>
                                  <CustomerContacts
                                    contacts={customerContacts.filter(
                                      (cA) => cA.accountName === c._id
                                    )}
                                    accountId={c._id}
                                    accountName={c.accountName}
                                    contactRoute="customer-contact"
                                  />
                                </>
                              ) : (
                                <Box textAlign="center" padding={2}>
                                  No Contacts
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </>
            </Box>
          ) : (
            <Typography>No Customer Accounts</Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default CustomerStrategy;
