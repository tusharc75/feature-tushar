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
  Menu,
  MenuItem,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { ExpandMore } from "@material-ui/icons";
import MoreVert from "@material-ui/icons/MoreVert";

import axiosInstance from "../../axios/axiosInstance";
import CustomerContacts from "./CustomerContacts";
import BoxWithBorder from "../../components/BoxWithBorder";
import OpportunityAccordianProjectSales from "./OpportunityAccordingProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ProjectInAccordion from "../../components/ProjectInAccordion/ProjectInAccordion";
import QuotesInAccordion from "../../components/QuotesInAccordion/QuotesInAccordion";
import ProductBuilderInAccordion from "../../components/ProductBuilderInAccordion/ProductBuilderInAccordion";
import ManageContactDialog from "../Contact/ManageContact";
import { customerAccount, customerContact } from "../../constants/helpers";
import ManageAccountDialog from "../Account/ManageAccount";

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
    ownerId,
  } = props;

  const classes = useStyles();
  const { setToastConfig } = useContext(CustomToastContext);
  const [expandedParent, setExpandedParent] = useState(true);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [collaborators, setCollaborators] = useState([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showContactCreateDialog, setShowContactCreateDialog] = useState(false);
  const [showAccountCreateDialog, setShowAccountCreateDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [accId, setAccId] = useState(null);

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

  const saveCustomerAccountToProject = async (id) => {
    const existingData = customerAccounts.map((contact) => contact._id);

    const dataObj = {
      customerAccount: [id, ...existingData],
      _id: projectId,
    };

    await axiosInstance()
      .put(`/project-sales/add-customer-account`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Customer Contact added successfully`,
          type: "success",
          open: true,
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const saveCustomerContactToProject = async (id) => {
    const existingData = customerContacts.map((contact) => contact._id);

    const dataObj = {
      customerContact: [id, ...existingData],
      _id: projectId,
    };

    await axiosInstance()
      .put(`/project-sales/add-customer-contact`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Customer Contact added successfully`,
          type: "success",
          open: true,
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  /* Actions for more icon */
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    type: string
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setDialogType(type);
    renderMenu(accId)
  };

  const renderMenu = (id: string = "") => {
    return (
      <Menu
        id="menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            if (dialogType === "customer-contact") {
              setShowContactCreateDialog(true);
            }
            if (dialogType === "customer-account") {
              setShowAccountCreateDialog(true);
            }
            handleClose();
          }}
        >
          Create New
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (dialogType === "customer-account") {
              handleOpenDialog(dialogType);
            }
            if (dialogType === "customer-contact") {
              handleOpenDialog(dialogType, id);
            }
            handleClose();
          }}
        >
          Add Exisiting
        </MenuItem>
      </Menu>
    );
  };

  return (
    <>
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
                aria-haspopup="true"
                color="primary"
                size="small"
                className={classes.addBtn}
                onClick={(e) => handleClick(e, "customer-account")}
              >
                <MoreVert />
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
                              collaborators={collaborators.filter(
                                (u) => u.optionValue !== ownerId
                              )}
                              users={collaborators.map((u) => ({
                                ...u,
                                default: u.optionValue === ownerId,
                              }))}
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
                                    aria-haspopup="true"
                                    color="primary"
                                    size="small"
                                    onClick={(e) => {
                                      handleClick(e, "customer-contact");
                                      setAccId(c._id);
                                    }}
                                  >
                                    <MoreVert />
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
                                    (ca) => ca.accountName === c._id
                                  ).length ? (
                                  <>
                                    <CustomerContacts
                                      contacts={customerContacts.filter(
                                        (ca) => ca.accountName === c._id
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
                  {dialogType && renderMenu(accId)}
                  {showContactCreateDialog && accId && (
                    <ManageContactDialog
                      open={showContactCreateDialog}
                      onClose={() => {
                        setShowContactCreateDialog(false);
                        setDialogType(null);
                        setAccId(null);
                      }}
                      onSuccess={(obj) => {
                        if (obj && obj.id) {
                          saveCustomerContactToProject(obj.id);
                        }
                      }}
                      contactResource={customerContact.contactResource}
                      accountId={accId}
                      contactApi={customerContact.contactApi}
                      account={customerAccount}
                      isRedirectToDetailPage={false}
                      collaborators={collaborators.filter(
                        (u) => u.optionValue !== ownerId
                      )}
                      owners={collaborators.map((u) => ({
                        ...u,
                        default: u.optionValue === ownerId,
                      }))}
                      fromProject={true}
                    />
                  )}
                  {showAccountCreateDialog && (
                    <ManageAccountDialog
                      open={showAccountCreateDialog}
                      onClose={({ id }) => {
                        setShowAccountCreateDialog(false);
                        if (id) {
                          saveCustomerAccountToProject(id);
                        }
                        setDialogType(null);
                        setAccId(null);
                      }}
                      accountResource={"customerAccount"}
                      accountApi={"customer-account"}
                      isRedirectToDetailPage={false}
                      collaborators={collaborators.filter(
                        (u) => u.optionValue !== ownerId
                      )}
                      owners={collaborators.map((u) => ({
                        ...u,
                        default: u.optionValue === ownerId,
                      }))}
                      fromProject={true}
                    />
                  )}
                </>
              </Box>
            ) : (
              <Typography>No Customer Accounts</Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>
    </>
  );
};

export default CustomerStrategy;
