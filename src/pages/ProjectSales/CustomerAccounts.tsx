import React, { useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import { Grid, Typography, makeStyles, Box, IconButton, Tabs, Tab, Menu, MenuItem, Button } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { MoreVert } from '@material-ui/icons';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import axiosInstance from '../../axios/axiosInstance';
import CustomerContacts from './CustomerContacts';
import BoxWithBorder from '../../components/BoxWithBorder';
import OpportunityAccordianProjectSales from './OpportunityAccordingProjectSales';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageContactDialog from '../Contact/ManageContact';
import { customerContact } from '../../constants/helpers';
import ManageAccountDialog from '../Account/ManageAccount';
import ConfirmationDialogRaw from '../../components/Helpers/ConfirmationDialog';
import QuotesAccordionInProjectSale from './QuotesAccordionInProjectSale';
import QuotationAccordionInProjectSales from './QuotationAccordionInProjectSales';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { isMobile, isTablet } from 'react-device-detect';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/components/CustomAccordion';
import routes from 'src/components/Helpers/Routes';

const useStyles = makeStyles((theme) => ({
  root: {
    border: '1px solid var(--common-border-color)',
    borderRadius: '5px',
    marginBottom: 12
  },
  expand: {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.standard
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  },
  addBtn: {
    // marginLeft: "auto",
  },
  cusName: {
    fontWeight: 700
  },
  tabProject: {
    // position:"static",

    borderRadius: '5px !important',
    border: '1px solid var(--common-border-color) !important',
    marginLeft: '10px',
    marginRight: '10px',
    backgroundColor: 'var(--dark-secondary, #fff) !important',
    rippleVisible: {
      animation: 'none !important'
    },
    '&.Mui-selected': {
      backgroundColor: 'var(--new_theme_color) !important',
      color: '#ffff !important',
      border: '1px solid #43AEAA !important',
      '& svg': {
        fill: 'var(--white)'
      },
      '&.MuiTab-labelIcon .MuiTab-wrapper > *:first-child': {
        display: 'flex',
        marginBottom: '0px',
        position: 'absolute',
        left: '92.5%'
      }
      //   "&.MuiTab-labelIcon .MuiTab-wrapper > *:first-child":{
      //     display:"flex",
      //     marginBottom:"0px",
      //     position:"absolute",
      //     left:"244px",
      //     color:"#43AEAA"
      // },
    },
    '& span.MuiTab-wrapper': {
      display: 'flex',
      flexDirection: 'row-reverse'
      //  position:"static"
    },

    '&.MuiTab-labelIcon .MuiTab-wrapper > *:first-child': {
      display: 'none'
    },

    '&.MuiTab-labelIcon .MuiTab-wrapper > *:after': {
      position: 'relative',
      left: '30%'
    },
    tab: {
      '&.MuiTabPanel-root': {
        flex: 1
      }
    }
  }
}));

const CustomerAccounts = (props) => {
  const {
    loading,
    handleOpenDialog,
    customerAccounts,
    opportunities,
    quotes,
    quotations,
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
    resources
  } = props;

  const classes = useStyles();
  const { setToastConfig } = useContext(CustomToastContext);
  const [expandedParent, setExpandedParent] = useState(true);
  const [expandCustomerContact, setExpandCustomerContact] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState<any>(0);
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

  const [selected, setSelected] = React.useState(0);

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (!users.length) return;

    const collabs = users.map((u, i) => ({
      optionValue: u._id,
      optionLabel: u.firstName + ' ' + u.lastName,
      order: i,
      default: false
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
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-opportunity`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Opportunity added successfully`,
          type: 'success',
          open: true
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
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-quote`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Quote added successfully`,
          type: 'success',
          open: true
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const saveQuotationToProject = (id) => {
    const existingData = quotations.map((o) => o._id);

    const dataObj = {
      quotation: [id, ...existingData],
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-quotation`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Quotation added successfully`,
          type: 'success',
          open: true
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
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-customer-account`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Customer Account added successfully`,
          type: 'success',
          open: true
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
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-customer-contact`, dataObj)
      .then(() => {
        setToastConfig({
          message: `Added successfully`,
          type: 'success',
          open: true
        });
        fetchProjectData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const handleRemoveAccount = (account) => {
    setShowConfirmBox(true);
    setAccountDeleteRec(account._id);
  };

  const removeAccount = (id) => {
    if (!currentAccount) return;

    // const id = currentAccount._id;

    const newAccountData = customerAccounts?.filter((ca) => ca._id !== id).map((contact) => contact._id);

    setRemoving(true);
    axiosInstance()
      .put(`/project-sales/add-customer-account`, {
        customerAccount: newAccountData,
        _id: projectId
      })
      .then(() => {
        setToastConfig({
          message: `Customer Account removed successfully`,
          type: 'success',
          open: true
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

    const newContactData = customerContacts?.filter((c) => c._id !== id).map((contact) => contact._id);

    setRemoving(true);
    axiosInstance()
      .put(`/project-sales/add-customer-contact`, {
        customerContact: newContactData,
        _id: projectId
      })
      .then(() => {
        setToastConfig({
          message: `Removed successfully`,
          type: 'success',
          open: true
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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, type: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setDialogType(type);
    renderMenu(accId);
  };

  const renderMenu = (id: string = '') => {
    return (
      <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            if (dialogType === 'customer-contact') {
              setShowContactCreateDialog(true);
            }
            if (dialogType === 'customer-account') {
              setShowAccountCreateDialog(true);
            }
            handleClose();
          }}
        >
          {isMobile && !isTablet ? 'New' : 'Create New'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (dialogType === 'customer-account') {
              handleOpenDialog(dialogType);
            }
            if (dialogType === 'customer-contact' && accId) {
              handleOpenDialog(dialogType, accId);
            }
            handleClose();
          }}
        >
          {isMobile && !isTablet ? 'Add' : 'Add Existing'}
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
            if (response && response['id']) {
              saveCustomerAccountToProject(response['id']);
            }
            setDialogType(null);
            setAccId(null);
          }}
          accountResource={'customerAccount'}
          accountApi={'customer-account'}
          isRedirectToDetailPage={false}
          collaborators={collaborators}
          owners={collaborators.map((u) => ({
            ...u,
            default: u.optionValue === ownerId
          }))}
          fromProject={true}
        />
      )}
      {showContactCreateDialog && accId && (
        <ManageContactDialog
          onClose={() => {
            setShowContactCreateDialog(false);
            setDialogType(null);
            setAccId(null);
          }}
          onSuccess={(data) => {
            if (data) {
              saveCustomerContactToProject(data._id);
            }
          }}
          contactResource={customerContact.contactResource}
          referenceData={{ accountName: accId }}
          contactApi={customerContact.contactApi}
          isClone={false}
          contactId={null}
        />
      )}
      <Box className={`${classes.root} ${'pannel_layout'}`}>
        <div>
          <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
            <Box
              display="flex"
              alignItems="center"
              className={clsx(classes.expand, {
                [classes.expandOpen]: expandedParent
              })}
            ></Box>
            <Typography variant="subtitle1" className={classes.cusName}>
              {resources?.customerAccount?.titlePlural}
            </Typography>
            {(permissions?.projectSales?.isUpdate && isTeamMember) || isManager ? (
              <>
                <Button
                  variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                  style={isMobile && !isTablet ? { color: 'var(--info-dark)', marginLeft: 'auto' } : { marginLeft: 'auto' }}
                  color="primary"
                  size="small"
                  onClick={() => {
                    setShowAccountCreateDialog(true);
                  }}
                >
                  {isMobile && !isTablet ? 'New' : 'Create New'}
                </Button>
                <Button
                  variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                  style={isMobile && !isTablet ? { color: 'var(--info-dark)', marginLeft: '10px' } : { marginLeft: '10px' }}
                  color="primary"
                  size="small"
                  onClick={() => {
                    handleOpenDialog('customer-account');
                  }}
                >
                  {isMobile && !isTablet ? 'Add' : 'Add Existing'}
                </Button>
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
                    className="oms-tab dynamic-vertical-tab tab_custom_style_customer_tab"
                    value={currentTabIndex}
                    onChange={(index, newValue) => {
                      setCurrentTabIndex(newValue);
                    }}
                    TabIndicatorProps={{
                      style: { display: 'none' }
                    }}
                    textColor="primary"
                    aria-label="scrollable auto tabs example"
                  >
                    {customerAccounts.map((c, i) => (
                      <Tab
                        wrapped
                        key={i}
                        tabIndex={i}
                        label={
                          <Grid container alignItems="center">
                            <Grid item xs={8}>
                              <Box component={'h4'} fontWeight={'bold'} className="title_container">
                                <AccountCircleIcon />
                                <span className="tabs_title">{c.accountName}</span>
                              </Box>
                            </Grid>
                            <Grid item xs={4} container justify="flex-end">
                              <IconButton
                                title={`Remove Account: ${c?.accountName}`}
                                aria-haspopup="true"
                                color="primary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAccount(c);
                                }}
                              >
                                <DeleteOutlineIcon color="primary" fontSize="small" />
                              </IconButton>
                            </Grid>
                          </Grid>
                        }
                        aria-controls={`vertical-tabpanel-${i}`}
                        id={`vertical-tab-${i}`}
                        className={classes.tabProject}
                      />
                    ))}
                  </Tabs>
                  {customerAccounts.map((c, i) => (
                    <Box hidden={currentTabIndex !== i} key={c._id}>
                      <Box mb={2}>
                        <Accordion expanded={expandCustomerContact} onChange={() => setExpandCustomerContact(!expandCustomerContact)}>
                          <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                            <Grid container>
                              <Grid item xs={8}>
                                <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                                  <IconButton size="small" onClick={(e) => e.preventDefault()}>
                                    {expandCustomerContact === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                  <Box>
                                    <Typography variant="subtitle2">
                                      {resources?.customerContact?.titlePlural} ({customerContacts.filter((ca) => ca.accountName === c._id).length})
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={4} container justify="flex-end" alignItems="center">
                                <Typography variant="subtitle2">
                                  {(permissions?.projectSales?.isUpdate && isTeamMember) || isManager ? (
                                    <IconButton
                                      aria-haspopup="true"
                                      color="primary"
                                      size="small"
                                      onClick={(e) => {
                                        handleClick(e, 'customer-contact');
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
                          <AccordionDetails>
                            <Box style={{ width: '100%' }}>
                              {loading ? (
                                [1, 2].map((i) => (
                                  <BoxWithBorder key={i} style={{ marginBottom: '8px' }}>
                                    <Box padding={1}>
                                      <Skeleton variant="text" width="100px" height="20px" />
                                      <Skeleton variant="text" width="100%" height="15px" />
                                    </Box>
                                  </BoxWithBorder>
                                ))
                              ) : customerContacts.filter((ca) => ca.accountName === c._id).length ? (
                                <CustomerContacts
                                  contacts={customerContacts.filter((ca) => ca.accountName === c._id)}
                                  accountId={c._id}
                                  accountName={c.accountName}
                                  contactRoute="customer-contact"
                                  handleRemoveContact={handleRemoveContact}
                                />
                              ) : (
                                <Box pb="6px">
                                  <Typography variant="subtitle1">No Contacts To Show</Typography>
                                </Box>
                              )}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      </Box>

                      {/*TODO: Heirarchy Table */}
                      {permissions?.projectSales?.isRead && (
                        <Box mb={2}>
                          <OpportunityAccordianProjectSales
                            opportunities={opportunities.filter((o) => o.customerAccount === c._id)}
                            onNewOpportunityAdd={(id) => {
                              saveOppToProject(id);
                            }}
                            permissions={permissions?.projectSales}
                            accountId={c._id}
                            accountName={c.accountName}
                            resource={'customerAccount'}
                            isRedirect={false}
                            expanded={false}
                            collaborators={collaborators}
                            users={collaborators.map((u) => ({
                              ...u,
                              default: u.optionValue === ownerId
                            }))}
                            projectId={projectId}
                            addExisting={handleOpenDialog}
                            fetchProjectData={fetchProjectData}
                            isTeamMember={isTeamMember}
                            isManager={isManager}
                          />
                        </Box>
                      )}
                      {permissions?.quoteBuilder?.isRead && (
                        <Box mb={2}>
                          <QuotesAccordionInProjectSale
                            expanded={false}
                            quotes={quotes.filter((q) => q.customerAccountName === c._id)}
                            recordsPerLine={3}
                            accountId={c._id}
                            accountResource={'customerAccount'}
                            permissions={permissions?.quoteBuilder}
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
                        </Box>
                      )}
                      {permissions?.quotation?.isRead && (
                        <Box>
                          <QuotationAccordionInProjectSales
                            expanded={false}
                            quotations={quotations?.filter((q) => q?.customerAccount === c?._id)}
                            recordsPerLine={3}
                            accountId={c._id}
                            permissions={permissions?.quotation}
                            projectId={projectId}
                            addExisting={handleOpenDialog}
                            fetchProjectData={fetchProjectData}
                            isTeamMember={isTeamMember}
                            isManager={isManager}
                            onNewQuotationAdd={(id) => {
                              saveQuotationToProject(id);
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </>
              </Box>
            ) : (
              <Typography>{`No ${resources?.customerAccount?.titlePlural}`}</Typography>
            )}
          </AccordionDetails>
        </div>
        {/*</Accordion>*/}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialogRaw
          open={showConfirmBox}
          message={
            accountDeleteRec
              ? 'Are you sure about removing this account from project?'
              : contactDeleteRec
              ? `Are you sure about removing this "${contactDeleteRec.firstName} ${contactDeleteRec.lastName}" contact from project?`
              : null
          }
          onClose={() => {
            setShowConfirmBox(false);
            setAccountDeleteRec(null);
          }}
          onOk={() => {
            if (accountDeleteRec) {
              removeAccount(accountDeleteRec);
            }

            if (contactDeleteRec) {
              removeContact();
            }
          }}
          okBtnLoading={isRemoving}
        />
      )}
    </>
  );
};

export default CustomerAccounts;
