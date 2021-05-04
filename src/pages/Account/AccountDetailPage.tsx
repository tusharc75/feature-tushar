import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Grid, Typography, IconButton, Container, Paper, AppBar, Card, CardContent, List } from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import { reverse as _reverse } from "lodash";
import { Skeleton, TabPanel } from "@material-ui/lab";
import CustomContainer from "../../components/CustomContainer";
import Layout from "../../components/Layout";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { accountPage } from "../../routes/Accounts";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { useData } from "../../StateProvider/Provider";
import DetailsPage from "../../components/Shared/DetailsPage";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import BoxWithBorder from "../../components/BoxWithBorder";
import RelatedContacts from "./RelatedContacts";
import axiosInstance from "./../../axios/axiosInstance";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import AccountHierarchy from "./AccountHierarchy";
import Activity from "../../components/Activity";
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import accountClass from "./account.module.scss";
import ManageContactDialog from "../Contact/ManageContact/index";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { makeStyles } from "@material-ui/core/styles";
import {
  // DisplayData,
  getObjKeysWithValues,
  isObjectEmpty,
  sidebarResource,
} from "../../constants/helpers";
import ManageAccount from "./ManageAccount/ManageAccount";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import QuickLinks, {
  IQuickLinks,
} from "../../components/QuickLinks/QuickLinks";
import OpportunityInAccordian from "../../components/OpportunityInAccordian/OpportunityInAccordian";
import { FcFlowChart, FcContacts, FcBinoculars, FcConferenceCall, FcMultipleSmartphones, FcMoneyTransfer } from 'react-icons/fc';
import ManageOpportunityDialog from "../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog";
import ProjectInAccordion from "../../components/ProjectInAccordion/ProjectInAccordion";
import QuotesInAccordion from "../../components/QuotesInAccordion/QuotesInAccordion";
import ProductBuilderInAccordion from "../../components/ProductBuilderInAccordion/ProductBuilderInAccordion";
import LeadInAccordion from "../../components/LeadsInAccordion/LeadsInAccordion";
import { Link } from 'react-router-dom'
import { BiFace } from 'react-icons/bi'
import { BsPerson } from 'react-icons/bs'
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { ListItemText } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: "0px",
    minHeight: "auto",
  },
  opportunityTab: {
    marginTop: "10px",
  },
}));

function DisplayData({ label, value, icon }) {
  return <div style={{ flexGrow: 1 }}>
    <List>
      <ListItem>
        <ListItemAvatar>
          {icon}
        </ListItemAvatar>
        <ListItemText primary={value} secondary={label} />
      </ListItem>
    </List>
  </div>
}

export default function AccountDetailPage(props) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const classes = useStyles();
  const {
    account: { accountApi, accountResource, accountPermission, accountRoute },
    accountBreadcrumb,
    contact: { contactResource, contactRoute, contactApi },
  } = props;

  const {
    state: { user, permissions },
  }: any = useData();

  const [headingLbl, setHeadingLbl] = useState("");
  const [isUpdating, setUpdating] = useState(false);
  const [accountData, setAccountData] = useState<any>({});
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [
    showApproveDisapproveConfirmBox,
    setShowApproveDisapproveConfirmBox,
  ] = useState(false);
  const [accountFields, setAccountFields] = useState([]);
  const [mainPoints, setMainPoints] = useState({});
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [accountHierarchyData, setAccountHierarchyData] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [relatedContactsLoading, setRelatedContactsLoading] = useState(false);
  const [
    showCreateOpportunityDialog,
    setShowCreateOpportunityDialog,
  ] = useState(false);
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [
    showAccountHierarchyInFullScreenDialog,
    setShowAccountHierarchyInFullScreenDialog,
  ] = useState(false);
  let { id } = useParams();

  useEffect(() => {
    setShowAccountHierarchyInFullScreenDialog(false);
    fetchAccountData();
    fetchRelatedData();
  }, [id]);

  const fetchRelatedData = () => {
    axiosInstance()
      .get(`/${accountApi}/related/${id}`)
      .then(({ data: { data } }) => {
        setRelatedContacts(
          data[sidebarResource[contactResource]] && data[sidebarResource[contactResource]]["Account_Name"]
            ? data[sidebarResource[contactResource]]["Account_Name"]
            : []
        );
        setOpportunities(
          data.Opportunity && data.Opportunity[sidebarResource[accountResource].replaceAll(" ", "_")]
            ? data.Opportunity[sidebarResource[accountResource].replaceAll(" ", "_")]
            : []
        );

        setRelatedContactsLoading(false);
      });
  };

  const fetchAccountData = async () => {
    setLoading(true);

    axiosInstance()
      .get(`/${accountApi}/${id}`)
      .then(({ data: { data } }) => {
        setCustomizedRoutes([accountBreadcrumb, { title: data.accountName }]);

        setHeadingLbl(data.accountName || "");
        handleMainPonts(data);
        setAccountData(data);
        setCanEdit(
          [...data?.collaborator ?? [], data?.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
        );

        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          let accounts = [
            ...data.parentHierarchy,
            {
              _id: data._id,
              accountName: data.accountName,
              typeOfAccount: data.typeOfAccount,
              industry: data.industry,
              typeOfBusiness: data.typeOfBusiness,
              phone: data.phone,
              type: "child",
              current: true,
              parentAccount: data.parentAccount
                ? {
                  _id: data.parentAccount.optionValue,
                  accountName: data.parentAccount.optionLabel,
                }
                : null,
              // parentAccountName: data.parentAccount?.optionLabel,
              // parentAccount: data.parentAccount?.optionValue
            },
          ];
          let newData = [];

          accounts.map((account) => {
            if (isObjectEmpty(account)) return true;

            const updatedAccount = {
              _id: account._id,
              accountName: account.accountName,
              typeOfAccount: account.typeOfAccount,
              industry: account.industry,
              typeOfBusiness: account.typeOfBusiness,
              phone: account.phone,
              type: "child",
              current: account.current,
            };

            if (account.parentAccount) {
              updatedAccount["parentAccountText"] =
                account.parentAccount.accountName;
              updatedAccount["parentAccountId"] = account.parentAccount._id;
            } else {
              updatedAccount["type"] = "parent";
            }

            newData.push(updatedAccount);
          });

          setAccountHierarchyData([...newData]);
        } else {
          setAccountHierarchyData([
            {
              _id: data._id,
              accountName: data.accountName,
              typeOfAccount: data.typeOfAccount,
              industry: data.industry,
              typeOfBusiness: data.typeOfBusiness,
              phone: data.phone,
              current: true,
            },
          ]);
        }

        if (accountFields.length === 0) {
          getAccountFields();
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleMainPonts = (data) => {
    let mainPoints = {
      Phone: data.phone || "",
    };
    if (data?.parentAccount?.optionLabel) {
      mainPoints["Parent Account"] = data.parentAccount.optionLabel;
    }
    if (data?.owner?.optionLabel) {
      mainPoints["Primary Owner"] = data.owner.optionLabel;
    }
    setMainPoints(mainPoints);
  };

  const getAccountFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource[accountResource]}`)
      .then(({ data: { data } }) => {
        setAccountFields(data.filter((d) => d.isUpdate || d.isRead));
        setLoading(false);
      });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: "Account Hierarchy",
      onClick: () => {
        setShowAccountHierarchyInFullScreenDialog(true);
      },
      icon: <FcFlowChart />,
      // icon: <TiFlowChildren />,
      show: true,
      class: "account"
    },
    {
      label: "Projects",
      count: 0,
      show: true,
      icon: <FcMultipleSmartphones />,
      class: "project"
    },
    {
      label: "Opportunity",
      count: opportunities ? opportunities.length : 0,
      show: permissions?.opportunity?.isRead ?? false,
      icon: <FcBinoculars />,
      class: "opportunity",
      onClick: () => {
        history.push({
          pathname: `/opportunity`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
          },
        });
      },
    },
    {
      label: "Quotes",
      count: 0,
      show: true,
      icon: <FcMoneyTransfer />,
      class: "quotes"
    },
    {
      label: "Accounts Teams",
      count: 0,
      show: true,
      icon: <FcConferenceCall />,
      class: "teams"
    },
    {
      label: "Contacts",
      count: relatedContacts ? relatedContacts.length : 0,
      icon: <FcContacts />,
      class: "contact",
      onClick: () => {
        history.push({
          pathname: `/${contactRoute}`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
          },
        });
      },
      show:
        permissions && permissions[contactResource]
          ? permissions[contactResource].isRead
          : false,
    },
  ].filter((d) => d.show);

  const handleDeleteAcc = () => {
    if (accountData?._id) {
      axiosInstance()
        .put(`/${accountApi}/remove`, { ids: [accountData._id] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          goBackToListing();
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleApproveDisapprove = () => {
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: [accountData._id],
        approved: !accountData.staticData?.approved,
      })
      .then(() => {
        fetchAccountData();
        setShowApproveDisapproveConfirmBox(false);
      })
      .catch(() => {
        setShowApproveDisapproveConfirmBox(false);
      });
  };

  const onUpdateAccount = (values) => {
    setUpdating(true);

    const updatedData = {
      ...values,
      _id: accountData._id,
    };

    axiosInstance()
      .put(`/${accountApi}`, updatedData)
      .then(({ data }) => {
        fetchAccountData();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setUpdating(false);
        setOpenUpdateDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const goBackToListing = () => {
    history.push({
      pathname: accountPage.path,
    });
  };

  const handleOpneUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  const handleViewAll = (path, state) => {
    history.push({
      pathname: path,
      state: {
        ...state,
      },
    });
  };

  const handleCreateContact = () => {
    setShowCreateContactDialog(true);
  };
  return (
    <>
      <Layout>
        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {
                <DetailsPageHeader
                  loading={loading}
                  heading={headingLbl}
                  isApproved={accountData?.staticData?.approved}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {permissions &&
                    permissions[accountResource] &&
                    permissions[accountResource].approveAccount && (
                      <>
                        <Button
                          variant="contained"
                          size="small"
                          color={
                            accountData.staticData?.approved ? "secondary" : "primary"
                          }
                          onClick={() => {
                            setShowApproveDisapproveConfirmBox(true);
                          }}
                        >
                          {accountData.staticData?.approved ? "Disapprove" : "Approve"}
                        </Button>
                        <Box component="span" marginX={0.50} />
                      </>
                    )}

                  {permissions &&
                    permissions[accountResource] &&
                    permissions[accountResource].isUpdate &&
                    canEdit && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleOpneUpdateDialog}
                        >
                          Edit
                    </Button>
                        <Box component="span" marginX={0.50} />
                      </>
                    )}

                  {permissions &&
                    permissions[accountResource] &&
                    permissions[accountResource].isDelete &&
                    accountData?.owner?.optionValue &&
                    user?.user?._id &&
                    accountData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                </DetailsPageHeader>
              }
              <Box>
                {loading ? (
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6}>
                        <Skeleton
                          variant="text"
                          width="100px"
                          height="16px"
                        />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <>
                    <Tabs className="oms-tab" value={currentTabIndex}
                      onChange={(index, newValue) => {
                        setCurrentTabIndex(newValue);
                      }}
                      indicatorColor="primary"
                      textColor="primary"
                      aria-label="icon tabs example"
                    >
                      <Tab
                        label="Details"
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                      />
                      <Tab
                        label="Account Hierarchy"
                        aria-controls="a11y-tabpanel-1"
                        id="a11y-tab-1"
                      />
                    </Tabs>
                    <Box hidden={currentTabIndex !== 0}>
                      <DetailsPage
                        data={accountData}
                        fields={accountFields}
                      />
                    </Box>
                    <Box hidden={currentTabIndex !== 1}>
                      <AccountHierarchy
                        data={accountHierarchyData}
                        currentAccountId={accountData._id}
                        accountRoute={accountRoute}
                      />
                    </Box>
                  </>
                )}
              </Box>
              {permissions?.opportunity?.isRead && (
                <OpportunityInAccordian
                  opportunityPermissions={permissions.opportunity}
                  opportunities={opportunities}
                  onNewOpportunityAdd={() => {
                    fetchRelatedData();
                  }}
                  accountId={accountData._id}
                  accountName={accountData.accountName}
                  recordsPerLine={3}
                  resource={accountResource}
                  isRedirect={false}
                />
              )}
              <ProjectInAccordion />
              <QuotesInAccordion />
              <ProductBuilderInAccordion />
              <LeadInAccordion />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper>
              <Grid container>
                <Grid item xs={12}>
                  {accountData && (
                    <div>
                      <Activity
                        relatedTo={[
                          {
                            type: accountResource,
                            referenceId: accountData._id,
                            access: true,
                          },
                        ]}
                        handleActivityRefresh={() => { }}
                      />
                    </div>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <QuickLinks quickLinks={quickLinks} />
                </Grid>

                {permissions &&
                  permissions[contactResource] &&
                  permissions[contactResource].isRead && (
                    <Grid item xs={12}>
                      <BoxWithBorder
                        style={{ marginTop: "3%", padding: "0px" }}
                      >
                        <div className={`${accountClass.detail_page_div3}`}>
                          <div className={`${accountClass.related_contacts}`}>
                            <Typography
                              color="primary"
                              variant="h6"
                              style={{ margin: "0 10px" }}
                            >
                              Related Contacts
                              </Typography>
                            {permissions[contactResource].isCreate && (
                              <span>
                                <IconButton
                                  onClick={handleCreateContact}
                                  color="primary"
                                  size="small"
                                >
                                  <ControlPointIcon />
                                </IconButton>
                              </span>
                            )}
                          </div>
                          {relatedContactsLoading ? (
                            <CommonSkeleton lenArray={[...Array(4).keys()]} />
                          ) : (
                            <>
                              <Box className={`${accountClass.custom_box1}`}>
                                <RelatedContacts
                                  contacts={_reverse(relatedContacts.slice(0, 2))}
                                  accountId={accountData._id}
                                  accountName={accountData.accountName}
                                  contactApi={contactApi}
                                  contactRoute={contactRoute}
                                />
                              </Box>
                            </>
                          )}
                        </div>
                      </BoxWithBorder>
                    </Grid>
                  )}


                {accountData?.staticData?.lead && permissions &&
                  permissions.lead &&
                  permissions.lead.isRead && (
                    <Grid item xs={12}>
                      <BoxWithBorder
                        style={{ marginTop: "3%", padding: "0px" }}
                      >
                        <div className={`${accountClass.detail_page_div3}`}>
                          <div className={`${accountClass.leads_data}`}>
                            <Typography
                              color="primary"
                              variant="h6"
                              style={{ margin: "0 10px" }}
                            >
                              Related Lead
                            </Typography>
                          </div>
                          {relatedContactsLoading ? (
                            <CommonSkeleton lenArray={[...Array(4).keys()]} />
                          ) : (
                            <>
                              <Box className={`${accountClass.custom_box1}`}>
                                <Card>
                                  <CardContent className="detailListing">
                                    <Grid container className="detailCardHeader">
                                      <Grid item xs={12} sm={12}>
                                        <Link className="link f_size"
                                          to={`/lead/detail/${accountData?.staticData?.lead?._id}`}>
                                          {accountData?.staticData?.lead?.firstName || ''} {accountData?.staticData?.lead?.lastName || ''}
                                        </Link>
                                      </Grid>
                                    </Grid>
                                    <Grid container>
                                      <Grid item xs={12} sm={6}>
                                        <DisplayData label='Title' value={accountData?.staticData?.lead?.title || '-'} icon={<BsPerson size={20} />} />
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              </Box>
                            </>
                          )}
                        </div>
                      </BoxWithBorder>
                    </Grid>
                  )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        <div>
          {showConfirmBox ? (
            <ConfirmationDialog
              open={showConfirmBox}
              message={`Are you sure you want to delete this Account ${accountData.accountName || ""
                }`}
              onClose={() => setShowConfirmBox(false)}
              onOk={handleDeleteAcc}
            />
          ) : null}
          {showApproveDisapproveConfirmBox ? (
            <ConfirmationDialog
              open={showApproveDisapproveConfirmBox}
              message={`Are you sure you want to ${accountData.staticData?.approved ? "disapprove" : "approve"
                } this Account ?`}
              onClose={() => setShowApproveDisapproveConfirmBox(false)}
              onOk={handleApproveDisapprove}
            />
          ) : null}
          {openUpdateDialog && (
            <ManageAccount
              isNew={false}
              open={openUpdateDialog}
              onClose={closeUpdateDIalog}
              entityData={{
                fields: accountFields.map((f) => {
                  return f.fieldData;
                }),
                initialValues: getObjKeysWithValues(
                  accountData,
                  accountFields.map((f) => {
                    return f.fieldData;
                  })
                ),
              }}
              loading={loading}
              handleSubmit={onUpdateAccount}
            />
          )}

          {showCreateOpportunityDialog && (
            <ManageOpportunityDialog
              open={showCreateOpportunityDialog}
              onClose={() => setShowCreateOpportunityDialog(false)}
              onSuccess={() => {
                setShowCreateOpportunityDialog(false);
                fetchRelatedData();
              }}
              accountId={accountData._id}
              resource={accountResource}
              isRedirectTodetailPage={false}
              userId={user?.user?._id}
            />
          )}
          {showCreateContactDialog && (
            <ManageContactDialog
              open={showCreateContactDialog}
              onClose={() => {
                setShowCreateContactDialog(false);
                fetchRelatedData();
              }}
              contactResource={contactResource}
              accountId={accountData._id}
              contactApi={contactApi}
              account={props?.account}
            />
          )}
          {showAccountHierarchyInFullScreenDialog && (
            <FullScreenDialog
              heading="Account Hierarchy"
              open={showAccountHierarchyInFullScreenDialog}
              close={() => {
                setShowAccountHierarchyInFullScreenDialog(false);
              }}
            >
              <AccountHierarchy
                data={accountHierarchyData}
                currentAccountId={accountData._id}
                accountRoute={accountRoute}
              />
            </FullScreenDialog>
          )}
        </div>
      </Layout>
    </>
  );
}
