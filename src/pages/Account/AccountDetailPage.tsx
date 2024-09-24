import { Box, Button, Card, CardContent, Grid, IconButton, List, ListItemIcon, ListItemText, Typography, useMediaQuery } from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem/ListItem';
import { Edit } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import { Skeleton } from '@material-ui/lab';
import { reverse as _reverse } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { BsPerson } from 'react-icons/bs';
import { FcApproval, FcDisapprove } from 'react-icons/fc';
import { Link, useHistory, useParams } from 'react-router-dom';
import { AccountHierarchyIcon, AccountsTeamsIcon, ContactsIcon, OpportunityIcon, ProjectsIcon, QuoteIcon } from 'src/assets/svg/svgIcons';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomNodalStructure from '../../components/CustomNodalStructure/CustomNodalStructure';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import FullScreenDialog from '../../components/Helpers/FullScreenDialog';
import OpportunityInAccordian from '../../components/OpportunityInAccordian/OpportunityInAccordian';
import ProcessFlow from '../../components/ProcessFlow';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuickLinks, { IQuickLinks } from '../../components/QuickLinks/QuickLinks';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  customerAccount,
  getObjKeysWithValues,
  isObjectEmpty,
  processFieldName,
  sidebarResource
} from '../../constants/helpers';
import { accountPage } from '../../routes/Accounts';
import ManageContactDialog from '../Contact/ManageContact';
import Step from '../DynamicForm/Step';
import ManageOpportunityDialog from '../Opportunities/ManageOpportunityDialog';
import axiosInstance from './../../axios/axiosInstance';
import routes from './../../components/Helpers/Routes';
import AccountHierarchy from './AccountHierarchy';
import ManageAccount from './ManageAccount/ManageAccount';
import ManageAccountDialog from './ManageAccount/index';
import RelatedContacts from './RelatedContacts';
import SupplierItems from './SupplierItems';
import Warehouse from './Warehouse';
import accountClass from './account.module.scss';

function DisplayData({ label, value, icon, highlightsHead = false }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List style={{ padding: 0 }}>
        <ListItem style={{ alignItems: 'flex-start', paddingInline: '0' }}>
          <ListItemIcon style={{ minWidth: '24px', marginTop: 11 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={
              highlightsHead ? (
                <span
                  style={{
                    background: '#EFFBF9',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    color: '#298B88',
                    fontWeight: 600
                  }}
                >
                  {value ? value : '-'}
                </span>
              ) : value ? (
                <span style={{ fontSize: '15px' }}>{value}</span>
              ) : (
                '-'
              )
            }
            secondary={<span style={{ fontSize: '14px' }}>{label}</span>}
          />
        </ListItem>
      </List>
    </div>
  );
}

export default function AccountDetailPage(props) {
  const isMobile = useMediaQuery('(max-width:600px)');

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    account: { accountApi, accountResource, accountRoute },
    accountBreadcrumb,
    contact: { contactResource, contactRoute, contactApi }
  } = props;

  const {
    state: { user, permissions, selectedEntity, tour },
    dispatch
  }: any = useData();
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [parentId, setParentId] = useState(undefined);
  const [accountData, setAccountData] = useState<any>({});
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [projectSales, setProjectSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showApproveDisapproveConfirmBox, setShowApproveDisapproveConfirmBox] = useState(false);
  const [accountFields, setAccountFields] = useState([]);
  const [mainPoints, setMainPoints] = useState({});
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);
  const [accountHierarchyData, setAccountHierarchyData] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [relatedContactsLoading, setRelatedContactsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);

  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [editAccountData, setEditAccountData] = useState<any>({});
  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [sectionFields, setSectionFields] = useState([]);
  const [openAdditionalDialog, setOpenAdditionalDialog] = useState(false);
  const [showAtLast, setShowAtLast] = useState(false);
  const [deleteAccount, setDeleteAccountId] = useState<any>({});
  const [additionalFieldName, setAdditionalFieldName] = useState('');
  const [showAccountHierarchyInFullScreenDialog, setShowAccountHierarchyInFullScreenDialog] = useState(false);

  const [loadingGraphData, setLoadingGraphData] = useState(false);
  const [graphData, setGraphData] = useState({
    edges: [],
    nodes: [],
    colorPalette: null
  });
  const [formValues, setFormValues] = useState({});
  const [resourceData, setResourceData] = useState(null);

  let filteredAccountFields = accountFields.filter((item) => item.fieldData.sectionName != additionalFieldName);
  let { id } = useParams();

  const typeCreateProjectSalesDialog = [
    {
      id: id,
      type: accountResource
    }
  ];

  useEffect(() => {
    if (deleteAccount && deleteAccount?._id && !showConfirmBox) {
      setShowConfirmBox(true);
    }
  }, [deleteAccount]);

  useEffect(() => {
    if (deleteAccount && deleteAccount?._id && !showConfirmBox) {
      setShowConfirmBox(true);
    }
  }, [deleteAccount]);

  const [tabValue, setTabValue] = useState(0);
  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    setShowAccountHierarchyInFullScreenDialog(false);
    setTabValue(0);
    fetchAccountData();
    fetchRelatedData();
    fetchPolicy();
  }, [id]);

  useEffect(() => {
    //  When it is nodal structure tab
    initializeGraphData();

    return () => {
      setGraphData({ edges: [], nodes: [], colorPalette: null });
    };
  }, [tabValue]);

  useEffect(() => {
    if ((tour.start && tour.path === '/customer-account/detail') || tour.path === '/supplier-account/detail') {
      if (tour.stepIndex === 6) {
        setTabValue(0);
      } else if (tour.stepIndex === 7) {
        setTabValue(1);
      } else if (tour.stepIndex === 8) {
        setTabValue(2);
      }
    }
  }, [tour]);

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = accountFields.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
      if (processSteps && processSteps.isRead && accountData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex((d) => d.optionLabel === accountData[processFieldName]);
        if (currentStepToShow >= 0) setActiveStep(currentStepToShow);
        if (currentStepToShow == steps.length - 1) {
          setShowAtLast(true);
          setFormValues(
            getObjKeysWithValues(
              accountData,
              filteredAccountFields.map((f) => {
                return f.fieldData;
              })
            )
          );
        } else {
          setShowAtLast(false);
        }
      }
    }
  }, [steps]);

  const initializeGraphData = () => {
    if (tabValue === 2) {
      setLoadingGraphData(true);
      setGraphData({ nodes: [], edges: [], colorPalette: null });

      axiosInstance()
        .get(`${accountApi}/nodal-structure/${id}`)
        .then(({ data }) => {
          setLoadingGraphData(false);
          setGraphData({
            nodes: [...data.data.nodes],
            edges: [...data.data.edges],
            colorPalette: data.colorPalette
          });
        })
        .catch((error) => {
          setLoadingGraphData(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const fetchRelatedData = () => {
    axiosInstance()
      .get(`/${accountApi}/related/${id}`)
      .then(({ data: { data } }) => {
        setRelatedContacts(
          data[sidebarResource[contactResource]] && data[sidebarResource[contactResource]]['Account_Name']
            ? data[sidebarResource[contactResource]]['Account_Name']
            : []
        );
        setOpportunities(
          data.Opportunity && data.Opportunity[sidebarResource[accountResource].replaceAll(' ', '_')]
            ? data.Opportunity[sidebarResource[accountResource].replaceAll(' ', '_')]
            : []
        );
        setProjectSales(
          data[sidebarResource.projectSales] && data[sidebarResource.projectSales][sidebarResource[accountResource].replaceAll(' ', '_')]
            ? data[sidebarResource.projectSales][sidebarResource[accountResource].replaceAll(' ', '_')]
            : []
        );
        setQuotes(
          data[sidebarResource.quoteBuilder] && data[sidebarResource.quoteBuilder][sidebarResource[accountResource].replaceAll(' ', '_')]
            ? data[sidebarResource.quoteBuilder][sidebarResource[accountResource].replaceAll(' ', '_')]
            : []
        );
        initializeGraphData();
        setRelatedContactsLoading(false);
      });
  };

  const fetchAccountData = async () => {
    setLoading(true);
    let data;
    const response: any = await axiosInstance().get(`/${accountApi}/${id}`);
    data = response?.data?.data;
    setCustomizedRoutes([accountBreadcrumb, { title: data.accountName }]);
    handleMainPonts(data);
    setAccountData(data);
    setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource[accountResource], data));
    setAllowedToDelete(checkIsAllowedToDelete(user, sidebarResource[accountResource], data?.owner?.optionValue));

    if (data?.parentHierarchy?.length) {
      let accounts = [
        ...data.parentHierarchy,
        {
          ...data,
          type: 'child',
          current: true
        }
      ];
      let newData = [];
      accounts.forEach((account) => {
        if (isObjectEmpty(account)) return true;
        const updatedAccount = {
          ...account,
          type: 'child',
          canEdit: checkIsAllowedToEdit(user, sidebarResource[accountResource], account)
        };
        newData.push(updatedAccount);
      });
      setAccountHierarchyData([...newData]);
    } else {
      setAccountHierarchyData([
        {
          ...data,
          current: true,
          canEdit: checkIsAllowedToEdit(user, sidebarResource[accountResource], data)
        }
      ]);
    }
    getAccountFields(data);
    setLoading(false);
    initializeGraphData();
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource[accountResource]}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainPonts = (data) => {
    let mainPoints = {
      Phone: data.phone || ''
    };
    if (data?.parentAccount?.optionLabel) {
      mainPoints['Parent Account'] = data.parentAccount.optionLabel;
    }
    if (data?.owner?.optionLabel) {
      mainPoints['Primary Owner'] = data.owner.optionLabel;
    }
    setMainPoints(mainPoints);
  };

  const getAccountFields = async (accountData = {}) => {
    let data;
    const response: any = await axiosInstance().get(`/field?resource=${sidebarResource[accountResource]}`);
    data = response?.data?.data;
    setAccountFields(data.filter((d) => d.isUpdate || d.isRead));
    setFormValues(
      getObjKeysWithValues(
        accountData,
        data.map((f) => {
          return f.fieldData;
        })
      )
    );

    setLoading(false);

    const processSteps = data.find((d) => d.isRead && d.fieldData.type.toLowerCase() === 'process');

    if (processSteps && processSteps.isRead) {
      setSteps(
        processSteps.fieldData.option.map((m) => {
          return {
            text: m.optionLabel,
            canCompleteManually: true
          };
        })
      );
      setShowAdditionalField(processSteps.fieldData.showAdditionalInfoPopup);
    }

    data.map((d) => {
      if (d.fieldData.sectionName == processSteps?.fieldData.additionalInfoSection && sectionFields.length == 0) {
        setSectionFields((prevItems) => {
          return [...prevItems, d];
        });
        setAdditionalFieldName(d.fieldData.sectionName);
      }
    });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: 'Account Hierarchy',
      onClick: () => {
        setShowAccountHierarchyInFullScreenDialog(true);
      },
      icon: <AccountHierarchyIcon width={42} height={42} />,
      show: true,
      class: 'account'
    },
    {
      label: 'Projects',
      count: projectSales ? projectSales.length : 0,
      show: permissions?.projectSales?.isRead,
      icon: <ProjectsIcon width={42} height={42} />,
      class: 'project',
      onClick: () => {
        history.push({
          pathname: `/project-sales`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
            resource: accountResource
          }
        });
      }
    },
    {
      label: 'Opportunity',
      count: opportunities ? opportunities.length : 0,
      show: permissions?.opportunity?.isRead ?? false,
      icon: <OpportunityIcon width={42} height={42} />,
      class: 'opportunity',
      onClick: () => {
        history.push({
          pathname: `/opportunity`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
            resource: accountResource
          }
        });
      }
    },
    {
      label: 'Quotes',
      count: quotes ? quotes.length : 0,
      show: permissions?.quoteBuilder?.isRead ?? false,
      icon: <QuoteIcon width={42} height={42} />,
      class: 'quotes',
      onClick: () => {
        history.push({
          pathname: routes.quoteBuilder.path,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
            resource: accountResource
          }
        });
      }
    },
    {
      label: 'Accounts Teams',
      count: 0,
      show: true,
      icon: <AccountsTeamsIcon width={42} height={42} />,
      class: 'teams'
    },
    {
      label: 'Contacts',
      count: relatedContacts ? relatedContacts.length : 0,
      icon: <ContactsIcon width={42} height={42} />,
      class: 'contact',
      onClick: () => {
        history.push({
          pathname: `/${contactRoute}`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName
          }
        });
      },
      show: permissions && permissions[contactResource] ? permissions[contactResource].isRead : false
    }
  ].filter((d) => d.show);

  const handleDeleteAcc = () => {
    let deleteId = deleteAccount && deleteAccount?._id ? deleteAccount._id : accountData?._id;
    if (deleteId) {
      axiosInstance()
        .put(`/${accountApi}/remove`, { ids: [deleteId] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setDeleteAccountId({});
          let fetchData = deleteAccount && deleteAccount?._id && deleteAccount?._id !== accountData?._id;
          if (fetchData) {
            fetchAccountData();
          } else {
            goBackToListing();
          }
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
        approved: !accountData.staticData?.approved
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
    setLoading(true);

    let updatedData = {
      ...values
    };
    if (editAccountData['_id']) {
      updatedData._id = editAccountData._id;
    } else {
      updatedData._id = accountData._id;
    }
    axiosInstance()
      .put(`/${accountApi}`, updatedData)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setEditAccountData({});
        setLoading(false);
        setOpenUpdateDialog(false);
        fetchAccountData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const goBackToListing = () => {
    history.push({
      pathname: accountPage.path
    });
  };

  const handleOpneUpdateDialog = () => {
    if (activeStep === steps.length - 1) {
      setShowAtLast(true);
    }
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
    setEditAccountData({});
  };

  const handleSave = (data) => {
    setIsProcessing(true);
    setShowAtLast(true);
    setOpenAdditionalDialog(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;

    let processFieldName = '';
    const accountFieldData = accountFields.map((f) => {
      if (f.fieldData.type == 'process') {
        processFieldName = f.fieldData.fieldName;
      }
      return f.fieldData;
    });

    const updatedAccountData = {
      ...accountData,
      ...data
    };

    const updatedData = {
      ...getObjKeysWithValues(updatedAccountData, accountFieldData),
      [processFieldName]: steps[tempActiveStep].text,
      _id: accountData._id
    };

    axiosInstance()
      .put(`${accountApi}`, updatedData)
      .then(() => {
        fetchAccountData();
        setIsProcessing(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsProcessing(false);
      });
  };

  const handleMarkAsCompleted = (data) => {
    setShowAtLast(false);
    setIsProcessing(true);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    if (tempActiveStep == steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = '';
      const accountFieldData = accountFields.map((f) => {
        if (f.fieldData.type == 'process') {
          processFieldName = f.fieldData.fieldName;
        }
        return f.fieldData;
      });

      const updatedData = {
        ...getObjKeysWithValues(accountData, accountFieldData),
        [processFieldName]: steps[tempActiveStep].text,
        _id: accountData._id
      };

      axiosInstance()
        .put(`${accountApi}`, updatedData)
        .then(() => {
          fetchAccountData();
          setIsProcessing(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsProcessing(false);
        });
    }
  };

  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const handleUpdate = (account) => {
    if (account._id) {
      axiosInstance()
        .get(`/${accountApi}/${account._id}`)
        .then(({ data: { data } }) => {
          setEditAccountData(data);
          setOpenUpdateDialog(true);
        });
    }
  };

  const handleCreateNewAccount = (id) => {
    setParentId(id);
    setShowCreateAccountDialog(true);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions && permissions[accountResource] && permissions[accountResource].approveAccount && allowedToEdit && (
              <ThemeButton
                mobileTooltip={accountData.staticData?.approved ? 'Disapprove' : 'Approve'}
                onClick={() => {
                  setShowApproveDisapproveConfirmBox(true);
                }}
                borderColor={accountData.staticData?.approved ? 'red' : 'none'}
                iconForMobile={accountData.staticData?.approved ? <FcDisapprove size={21} /> : <FcApproval size={21} />}
                color={accountData.staticData?.approved ? 'secondary' : 'primary'}
              >
                {accountData.staticData?.approved ? 'Disapprove' : 'Approve'}
              </ThemeButton>
            )}

            {permissions && permissions[accountResource] && permissions[accountResource].isUpdate && allowedToEdit && (
              <Button variant={isMobile ? 'text' : 'contained'} size="small" onClick={handleOpneUpdateDialog} className={'btn-outline-v1'}>
                {isMobile ? <Edit /> : 'Edit'}
              </Button>
            )}
            {permissions && permissions[accountResource] && permissions[accountResource].isDelete && allowedToDelete && (
              <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
            )}
            <ActivityButton referenceId={accountData?._id} resource={accountResource} resourceLabel={accountData?.accountName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <ProcessFlow
          disableBackNext={permissions && permissions[accountResource] && permissions[accountResource].isUpdate && allowedToEdit ? false : true}
          steps={steps}
          activeStep={activeStep}
          handleMarkAsCompleted={handleMarkAsCompleted}
        />
        {loading ? (
          <Grid container spacing={2}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Grid item sm={6} md={6}>
                <Skeleton variant="text" width="100px" height="16px" />
                <Box marginY={1} />
                <Skeleton width="100%" height="50px" />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
              <CustomTab value={0} label={'Details'} />
              <CustomTab value={1} label={'Account Hierarchy'} id="a11y-tab-1" className="tabLayout" />
              <CustomTab value={2} label={'OM-Neurons'} />
              {accountResource === 'supplierAccount' && user?.user?.brandPolicy?.serializedAssetCertification && (
                <CustomTab value={3} label={'Supplier View'} />
              )}
              {accountResource === 'customerAccount' && permissions?.productInventory && <CustomTab value={4} label={routes.warehouse.title} />}
              {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 5} label={tab?.tabName} />)}
            </CustomTabs>
            <TabPanel value={tabValue} index={0}>
              <Box>
                {showAtLast ? (
                  <DetailsPage data={accountData} fields={accountFields} />
                ) : (
                  <DetailsPage data={accountData} fields={filteredAccountFields} />
                )}

                <div className="pt-3 ">
                  {permissions?.opportunity?.isRead && (
                    <Box id="opportunityAccordion" mb={2}>
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
                        isAllowedToUpdate={permissions && permissions[accountResource] && permissions[accountResource].isUpdate && allowedToEdit}
                      />
                    </Box>
                  )}
                  {permissions?.projectSales?.isRead && accountResource == customerAccount.accountResource && (
                    <Box id="projectsAccordion" mb={2}>
                      <ProjectInAccordion
                        recordsPerLine={3}
                        projectSales={projectSales}
                        type={typeCreateProjectSalesDialog}
                        fetchData={fetchRelatedData}
                        permissions={permissions}
                        isAddProjectSale={true}
                        isAllowedToEdit={permissions && permissions[accountResource] && permissions[accountResource].isUpdate && allowedToEdit}
                        accountId={accountData._id}
                        accountName={accountData.accountName}
                        resource={accountResource}
                      />
                    </Box>
                  )}
                  {permissions?.quoteBuilder?.isRead && accountResource == customerAccount.accountResource && (
                    <Box id="quotesAccordion" mb={2}>
                      <QuotesInAccordion
                        recordsPerLine={3}
                        quotes={quotes}
                        fetchData={fetchRelatedData}
                        quoteBuilderPermission={permissions.quoteBuilder}
                        accountId={id}
                        accountName={accountData.accountName}
                        accountResource={accountResource}
                        isRenderedFromCustomerAccount={true}
                        isAllowedToUpdate={permissions && permissions[accountResource] && permissions[accountResource].isUpdate && allowedToEdit}
                      />
                    </Box>
                  )}
                </div>
                <Box mb={2}>
                  <Grid item xs={12}>
                    <QuickLinks quickLinks={quickLinks} />
                  </Grid>
                </Box>
                <div className="single-form-v1">
                  <div className="form-head-v1 relative">
                    <h3 className="form-label-style-v1">Related Contacts & Leads</h3>
                    {permissions[contactResource]?.isCreate && (
                      <span style={{ position: 'absolute', right: 15 }}>
                        <HtmlTooltip title={`Add ${routes[contactResource]?.title || ''}`} placement="top">
                          <IconButton
                            onClick={() => {
                              setShowCreateContactDialog(true);
                            }}
                            color="primary"
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </HtmlTooltip>
                      </span>
                    )}
                  </div>
                  <div className="formdata-v1">
                    {permissions && permissions[contactResource] && permissions[contactResource].isRead && (
                      <>
                        {relatedContactsLoading ? (
                          <CommonSkeleton lenArray={[...Array(4).keys()]} />
                        ) : (
                          <>
                            <RelatedContacts
                              contacts={_reverse(relatedContacts.slice(0, 2))}
                              accountId={accountData._id}
                              accountName={accountData.accountName}
                              contactApi={contactApi}
                              contactRoute={contactRoute}
                            >
                              {accountData?.staticData?.lead && permissions && permissions.lead && permissions.lead.isRead && (
                                <>
                                  {relatedContactsLoading ? (
                                    <CommonSkeleton lenArray={[...Array(4).keys()]} />
                                  ) : (
                                    <Grid item xs={12} sm={12} md={6} lg={4}>
                                      <Card className="detailCard card-v1" variant="outlined">
                                        <CardContent className="card-link">
                                          <Box>
                                            {accountData?.staticData?.lead?.entity === selectedEntity ? (
                                              <Link className="link f_size" to={`/lead/detail/${accountData?.staticData?.lead?._id}`}>
                                                <Typography component={'span'} className="detailName">
                                                  {accountData?.staticData?.lead?.concatedName || ''}
                                                </Typography>
                                              </Link>
                                            ) : hasAccessToEntity(accountData?.staticData?.lead?.entity) ? (
                                              <Link
                                                className="link f_size"
                                                onClick={() => {
                                                  handleEntityChange(accountData?.staticData?.lead?.entity);
                                                  history.push(`/lead/detail/${accountData?.staticData?.lead?._id}`);
                                                }}
                                              >
                                                <Typography component={'span'} className="detailName">
                                                  {accountData?.staticData?.lead?.concatedName || ''}
                                                </Typography>
                                              </Link>
                                            ) : (
                                              <span className="detailName">{accountData?.staticData?.lead?.concatedName || ''}</span>
                                            )}
                                            <Typography
                                              component={'span'}
                                              style={{
                                                display: 'inline-block',
                                                backgroundColor: '#298B88',
                                                color: 'white',
                                                marginLeft: 31,
                                                padding: '4px 11px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                marginBottom: 8
                                              }}
                                            >
                                              Related Lead
                                            </Typography>
                                          </Box>
                                          <Grid container>
                                            <Grid item xs={12} sm={6}>
                                              <DisplayData
                                                label="Title"
                                                value={accountData?.staticData?.lead?.title || '-'}
                                                icon={<BsPerson size={15} />}
                                              />
                                            </Grid>
                                          </Grid>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  )}
                                </>
                              )}
                            </RelatedContacts>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Box>
                <AccountHierarchy
                  data={accountHierarchyData}
                  currentAccountId={accountData._id}
                  accountRoute={accountRoute}
                  handleUpdate={handleUpdate}
                  onCreateNewAccount={handleCreateNewAccount}
                  canUpdate={permissions && permissions[accountResource] && permissions[accountResource].isUpdate}
                  canCreate={permissions && permissions[accountResource] && permissions[accountResource].isCreate}
                  canDelete={permissions && permissions[accountResource] && permissions[accountResource].isDelete}
                  handleDelete={(data) => {
                    setDeleteAccountId(data);
                  }}
                  accountResource={accountResource}
                />
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <Box>
                <CustomNodalStructure
                  id={id}
                  graphData={graphData}
                  loadingGraphData={loadingGraphData}
                  onClick={(node) => {
                    if (node && routes[node.route]) {
                      history.push({
                        pathname: `${routes[node.route].path}/${node.redirectId}`
                      });
                    }
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <SupplierItems
                api={accountApi}
                id={id}
                allowedToEdit={permissions[accountResource].isUpdate}
                permission={permissions[accountResource]}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <Warehouse reference={accountResource} api={accountApi} id={id} />
            </TabPanel>
            {resourceData &&
              resourceData?.tabs?.length > 0 &&
              resourceData?.tabs?.map((tab, i) => {
                return (
                  <TabPanel value={tabValue} index={i + 5}>
                    <Step
                      tab={tab}
                      resourcePolicyId={resourceData?._id}
                      resourceId={id}
                      resource={sidebarResource[accountResource]}
                      data={accountData}
                      allowedToEdit={permissions[accountResource]?.isUpdate}
                    />
                  </TabPanel>
                );
              })}
          </>
        )}
      </Box>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Account ${
            deleteAccount?.accountName ? deleteAccount?.accountName : accountData.accountName || ''
          }`}
          onClose={() => {
            setShowConfirmBox(false);
            setDeleteAccountId({});
          }}
          onOk={handleDeleteAcc}
        />
      ) : null}
      {showApproveDisapproveConfirmBox ? (
        <ConfirmationDialog
          open={showApproveDisapproveConfirmBox}
          message={`Are you sure you want to ${accountData.staticData?.approved ? 'disapprove' : 'approve'} this Account ?`}
          onClose={() => setShowApproveDisapproveConfirmBox(false)}
          onOk={handleApproveDisapprove}
        />
      ) : null}
      {openUpdateDialog && showAtLast ? (
        <ManageAccount
          isNew={false}
          open={openUpdateDialog}
          onClose={closeUpdateDIalog}
          accountData={{
            fields: accountFields.map((f) => {
              return f.fieldData;
            }),
            initialValues: getObjKeysWithValues(
              accountData,
              accountFields.map((f) => {
                return f.fieldData;
              })
            )
          }}
          loading={loading}
          handleSubmit={onUpdateAccount}
          accountId={accountData?._id}
          formValues={formValues}
        />
      ) : openUpdateDialog ? (
        <ManageAccount
          isNew={false}
          open={openUpdateDialog}
          onClose={closeUpdateDIalog}
          accountData={{
            fields: filteredAccountFields.map((f) => {
              return f.fieldData;
            }),
            initialValues: getObjKeysWithValues(
              Object.keys(editAccountData).length ? editAccountData : accountData,
              filteredAccountFields.map((f) => {
                return f.fieldData;
              })
            )
          }}
          loading={loading}
          handleSubmit={onUpdateAccount}
          accountId={editAccountData._id ? editAccountData._id : accountData?._id}
          formValues={formValues}
          handleAddressDataSource={() => {}}
        />
      ) : null}

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
          opportunityId={null}
        />
      )}
      {showCreateContactDialog && (
        <ManageContactDialog
          onClose={() => {
            setShowCreateContactDialog(false);
            fetchRelatedData();
          }}
          contactResource={contactResource}
          contactId={null}
          isClone={false}
          contactApi={contactApi}
          onSuccess={() => {
            fetchRelatedData();
          }}
          referenceData={{ accountName: accountData._id }}
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
            accountResource={accountResource}
            canUpdate={permissions && permissions[accountResource] && permissions[accountResource].isUpdate}
            canCreate={permissions && permissions[accountResource] && permissions[accountResource].isCreate}
            canDelete={permissions && permissions[accountResource] && permissions[accountResource].isDelete}
          />
        </FullScreenDialog>
      )}
      {showCreateAccountDialog ? (
        <ManageAccountDialog
          open={showCreateAccountDialog}
          onClose={() => {
            setShowCreateAccountDialog(false);
            setParentId(undefined);
            fetchAccountData();
          }}
          parentId={parentId}
          id={null}
          accountResource={accountResource}
          accountApi={accountApi}
          isClone={false}
          accountNameForClone={''}
          isRedirectToDetailPage={false}
        />
      ) : null}
      {openAdditionalDialog && (
        <AdditionalDialogPopUp
          open={openAdditionalDialog}
          close={() => setOpenAdditionalDialog(false)}
          title="Additional Dialog"
          handleSave={handleSave}
          fieldData={sectionFields}
        />
      )}
    </Box>
  );
}
