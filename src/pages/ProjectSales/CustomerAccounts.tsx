import React, { useContext, useEffect, useState } from "react";
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
import { Delete, ExpandMore, MoreVert } from "@material-ui/icons";
import axiosInstance from "../../axios/axiosInstance";
import CustomerContacts from "./CustomerContacts";
import BoxWithBorder from "../../components/BoxWithBorder";
import OpportunityAccordianProjectSales from "./OpportunityAccordingProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageContactDialog from "../Contact/ManageContact";
import { customerAccount, customerContact } from "../../constants/helpers";
import ManageAccountDialog from "../Account/ManageAccount";
import ConfirmationDialogRaw from "../../components/Helpers/ConfirmationDialog";
import QuotesAccordionInProjectSale from "./QuotesAccordionInProjectSale";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";

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
    width: "100%"
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

const CustomerAccounts = (props) => {
  const {
    loading,
    handleOpenDialog,
    customerAccounts,
    opportunities,
    quotes,
    permissions,
    fetchProjectData,
    customerContacts,
    projectId,
    users,
    isTeamMember,
    isManager,
    ownerId,
    currency = null,
    marketSegmentId = null,
    subMarketSegmentId = null,
    estimatedAmount = null,
  } = props;

  const classes = useStyles();
  const { setToastConfig } = useContext(CustomToastContext);
  const [expandedParent, setExpandedParent] = useState(true);
  const [expandCustomerContact, setExpandCustomerContact] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [collaborators, setCollaborators] = useState([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showContactCreateDialog, setShowContactCreateDialog] = useState(false);
  const [showAccountCreateDialog, setShowAccountCreateDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(customerAccounts[0]);
  const [accId, setAccId] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isRemoving, setRemoving] = useState(false);
  const [accountDeleteRec, setAccountDeleteRec] = useState(null);
  const [contactDeleteRec, setContactDeleteRec] = useState(null);

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

  useEffect(() => {
    if (customerAccounts.length) {
      setCurrentAccount(customerAccounts[currentTabIndex]);
    }
  }, [currentTabIndex, customerContacts]);

  /**
   *  Save opportunity data in project sales
   * @param id
   */
  const saveOppToProject = (id) => {
    const existingData = opportunities.map((o) => o._id);

    const dataObj = {
      opportunity: [id, ...existingData],
      _id: projectId,
    };

    axiosInstance()
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

  const saveQuoteToProject = (id) => {
    const existingData = quotes.map((o) => o._id);

    const dataObj = {
      quoteBuilder: [id, ...existingData],
      _id: projectId,
    };

    axiosInstance()
      .put(`/project-sales/add-quote`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Quote added successfully`,
          type: "success",
          open: true,
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const saveCustomerAccountToProject = (id) => {
    const existingData = customerAccounts.map((contact) => contact._id);

    const dataObj = {
      customerAccount: [id, ...existingData],
      _id: projectId,
    };

    axiosInstance()
      .put(`/project-sales/add-customer-account`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Customer Account added successfully`,
          type: "success",
          open: true,
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const saveCustomerContactToProject = (id) => {
    const existingData = customerContacts.map((contact) => contact._id);

    const dataObj = {
      customerContact: [id, ...existingData],
      _id: projectId,
    };

    axiosInstance()
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

  const handleRemoveAccount = () => {
    setShowConfirmBox(true);
    setAccountDeleteRec(currentAccount._id);
  };

  const removeAccount = () => {
    if (!currentAccount) return;

    const id = currentAccount._id;

    const newAccountData = customerAccounts
      ?.filter((ca) => ca._id !== id)
      .map((contact) => contact._id);

    setRemoving(true);
    axiosInstance()
      .put(`/project-sales/add-customer-account`, {
        customerAccount: newAccountData,
        _id: projectId,
      })
      .then(() => {
        setToastConfig({
          message: `Customer Account removed successfully`,
          type: "success",
          open: true,
        });
        setRemoving(false);
        setShowConfirmBox(false);
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
        setRemoving(false);
        setShowConfirmBox(false);
      });
  };

  const handleRemoveContact = (data) => {
    setShowConfirmBox(true);
    setContactDeleteRec(data);
  };

  const removeContact = () => {
    if (!contactDeleteRec) return;

    const id = contactDeleteRec._id;

    const newContactData = customerContacts
      ?.filter((c) => c._id !== id)
      .map((contact) => contact._id);

    setRemoving(true);
    axiosInstance()
      .put(`/project-sales/add-customer-contact`, {
        customerContact: newContactData,
        _id: projectId,
      })
      .then(() => {
        setToastConfig({
          message: `Customer Contact removed successfully`,
          type: "success",
          open: true,
        });
        setRemoving(false);
        setShowConfirmBox(false);
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
        setRemoving(false);
        setShowConfirmBox(false);
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
    renderMenu(accId);
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
            if (dialogType === "customer-contact" && accId) {
              handleOpenDialog(dialogType, accId);
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
      {dialogType && renderMenu()}
      {showAccountCreateDialog && (
        <ManageAccountDialog
          open={showAccountCreateDialog}
          onClose={(response) => {
            setShowAccountCreateDialog(false);
            if (response && response["id"]) {
              saveCustomerAccountToProject(response["id"]);
            }
            setDialogType(null);
            setAccId(null);
          }}
          accountResource={"customerAccount"}
          accountApi={"customer-account"}
          isRedirectToDetailPage={false}
          collaborators={collaborators}
          owners={collaborators.map((u) => ({
            ...u,
            default: u.optionValue === ownerId,
          }))}
          fromProject={true}
        />
      )}
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
          collaborators={collaborators}
          owners={collaborators.map((u) => ({
            ...u,
            default: u.optionValue === ownerId,
          }))}
          fromProject={true}
        />
      )}
      <Paper className={classes.root} >
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
            {(permissions?.isUpdate && isTeamMember) || isManager ? (
              <>
                <IconButton
                  aria-haspopup="true"
                  color="primary"
                  size="small"
                  className={classes.addBtn}
                  onClick={(e) => {
                    handleClick(e, "customer-account");
                  }}
                >
                  <MoreVert />
                </IconButton>

                <Box component="span" mx={1} />
                {customerAccounts.length > 0 &&
                  opportunities.filter(
                    (o) => o.customerAccountName === currentAccount?._id
                  ).length < 1 ? (
                  <IconButton
                    title={`Remove Account: ${currentAccount?.accountName}`}
                    aria-haspopup="true"
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAccount();
                    }}
                  >
                    <Delete color="error" />
                  </IconButton>
                ) :
                  <IconButton
                    aria-haspopup="true"
                    color="primary"
                    size="small"
                    className="cursor-stop"
                  >
                    <Delete color="disabled" />
                  </IconButton>
                }
              </>
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
                    <Box hidden={currentTabIndex !== i} key={c._id}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>

                          <Accordion
                            expanded={expandCustomerContact}

                            className="omsAccordian"
                            onChange={() => setExpandCustomerContact(!expandCustomerContact)}
                          >
                            <AccordionSummary
                              style={{ padding: 0 }}
                              aria-controls="user-panel-content"
                              id="user-panel-header"
                            >
                              <Grid container>
                                <Grid item xs={8}>
                                  <Box
                                    component="div"
                                    display="flex"
                                    alignItems="center"
                                    flexGrow={1}
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      {expandCustomerContact === true ? (
                                        <ExpandLessIcon />
                                      ) : (
                                        <ExpandMoreIcon />
                                      )}
                                    </IconButton>
                                    <Box>
                                      <Typography variant="subtitle2">
                                        Customer Contacts (
                                        {
                                          customerContacts.filter(
                                            (ca) => ca.accountName === c._id
                                          ).length
                                        }
                                        )
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={4} container justify="flex-end" alignItems="center">
                                  <Typography variant="subtitle2">
                                    {(permissions?.isUpdate && isTeamMember) ||
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
                                  </Typography>
                                </Grid>
                              </Grid>
                            </AccordionSummary>
                            <Box margin={0.5} />
                            <AccordionDetails>
                              <Box style={{ width: '100%' }}>
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
                                  <CustomerContacts
                                    contacts={customerContacts.filter(
                                      (ca) => ca.accountName === c._id
                                    )}
                                    accountId={c._id}
                                    accountName={c.accountName}
                                    contactRoute="customer-contact"
                                    handleRemoveContact={handleRemoveContact}
                                  />
                                ) : (
                                  <Box pb="6px">
                                    <Typography variant="subtitle1">
                                      No Contacts To Show
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </AccordionDetails>
                          </Accordion>



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
                          {
                            permissions?.isRead && (
                              <QuotesAccordionInProjectSale
                                expanded={true}
                                quotes={quotes.filter((q) => q.customerAccountName === c._id)}
                                recordsPerLine={3}
                                accountId={c._id}
                                accountResource={"customerAccount"}
                                permissions={permissions}
                                projectId={projectId}
                                addExisting={handleOpenDialog}
                                fetchProjectData={fetchProjectData}
                                isTeamMember={isTeamMember}
                                isManager={isManager}
                                onNewQuoteAdd={(id) => {
                                  saveQuoteToProject(id);
                                }}
                                currency={currency}
                                estimatedAmount={estimatedAmount}
                                marketSegmentId={marketSegmentId}
                                subMarketSegmentId={subMarketSegmentId}
                                isFromProjectSales={true}
                                projectSalesTeam={collaborators}
                              />
                            )
                          }
                          {/* <QuotesInAccordion /> */}
                          {/* <ProjectInAccordion
                            recordsPerLine={3}
                            projectSales={null} /> */}

                          {/* <ProductBuilderInAccordion /> */}
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
      {
        showConfirmBox && (
          <ConfirmationDialogRaw
            open={showConfirmBox}
            message={
              accountDeleteRec
                ? "Are you sure about removing this account from project?"
                : contactDeleteRec
                  ? `Are you sure about removing this "${contactDeleteRec.firstName} ${contactDeleteRec.lastName}" contact from project?`
                  : null
            }
            onClose={() => {
              setShowConfirmBox(false);
              setAccountDeleteRec(null);
            }}
            onOk={
              accountDeleteRec
                ? removeAccount
                : contactDeleteRec
                  ? removeContact
                  : null
            }
            okBtnLoading={isRemoving}
          />
        )
      }
    </>
  );
};

export default CustomerAccounts;