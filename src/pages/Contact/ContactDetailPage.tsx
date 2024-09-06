import { Box, Button, Dialog, Grid, List, ListItemText, Paper, Typography } from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiOutlineMail } from 'react-icons/ai';
import { BiPhone } from 'react-icons/bi';
import { FiStar } from 'react-icons/fi';
import { HiShoppingCart } from 'react-icons/hi';
import { MdDelete } from 'react-icons/md';
import { RiLayoutFill } from 'react-icons/ri';
import { Link, useHistory, useParams } from 'react-router-dom';
import { AccountHierarchyIcon } from 'src/assets/svg/svgIcons';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import FullScreenDialog from '../../components/Helpers/FullScreenDialog';
import OpportunityInAccordian from '../../components/OpportunityInAccordian/OpportunityInAccordian';
import OrgChartContainer from '../../components/OrgChart/OrgChartContainer';
import ProcessFlow from '../../components/ProcessFlow';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuickLinks, { IQuickLinks } from '../../components/QuickLinks/QuickLinks';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import DetailsPage from '../../components/Shared/DetailsPage';
import Warehouse from '../Account/Warehouse';
import axiosInstance from './../../axios/axiosInstance';
import {
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  CustomDialogTransition,
  customerAccount,
  customerContact,
  getObjKeysWithValues,
  processFieldName,
  sidebarResource
} from './../../constants/helpers';
import AddReportsToContact from './AddReportsToContact';
import ManageContactDialog from './ManageContact';

const ContactDetailsPage = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    contact: { contactApi, contactResource, contactRoute },
    account: { accountResource },
    contactBreadcrumb
  } = props;
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, tour },
    dispatch
  }: any = useData();

  const [contactData, setContactData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [contactFields, setContactFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);

  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [sectionFields, setSectionFields] = useState([]);
  const [openAdditionalDialog, setOpenAdditionalDialog] = useState(false);
  const [showAtLast, setShowAtLast] = useState(false);
  const [additionalFieldName, setAdditionalFieldName] = useState('');
  const [contactPermissions, setContactPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState<any>(0);
  const [orgChartData, setOrgChartData] = useState([]);
  const [orgChartInFullScreenDialog, setOrgChartInFullScreenDialog] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [projectSales, setProjectSales] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddContact, setShowAddContact] = useState(false);
  const [showEntityRoleDialog, setShowEntityRoleDialog] = useState(false);
  const [entityAccess, setEntityAccess] = useState([]);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);

  let { id } = useParams();

  const [typeCreateProjectSalesDialog, setTypeCreateProjectSalesDialog] = useState([]);

  useEffect(() => {
    const hasContactPermission = permissions[contactResource];
    if (hasContactPermission) {
      setContactPermissions({
        isCreate: hasContactPermission.isCreate,
        isUpdate: hasContactPermission.isUpdate,
        isRead: hasContactPermission.isRead,
        isDelete: hasContactPermission.isDelete
      });
    }

    if (id) {
      fetchContactData();
      fetchRelatedData();
      fetchLoggedInUserRole();
      fetchLoggedInUserEntities();
    }
  }, [id]);

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = contactFields.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
      if (processSteps && processSteps.isRead && contactData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex((d) => d.optionLabel === contactData[processFieldName]);
        if (currentStepToShow >= 0) setActiveStep(currentStepToShow);
        if (currentStepToShow === steps.length - 1) {
          setShowAtLast(true);
        } else {
          setShowAtLast(false);
        }
      }
    }
  }, [steps]);

  useEffect(() => {
    if ((tour.start && tour.path === '/customer-contact/detail') || tour.path === '/supplier-contact/detail') {
      if (tour.stepIndex === 5) {
        setCurrentTabIndex(0);
      } else if (tour.stepIndex === 6) {
        setCurrentTabIndex(1);
      }
    }
  }, [tour]);

  const fetchLoggedInUserRole = async () => {
    let roleIds = [];
    await axiosInstance()
      .get(`/user/${user.user?._id}`)
      .then(({ data: { data } }) => {
        data.entities.map((item) => {
          item.role.forEach((role) => {
            if (roleIds.includes(role?._id)) {
            } else {
              roleIds.push(role?._id);
            }
          });
        });
        setRoleAccessOfLoggedInUser(roleIds);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds);
  };

  const fetchContactData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`/${contactApi}/${id}`)
      .then(({ data: { data } }) => {
        handleAllowToEditList(data);
        setContactData(data);
        getContactFields();
        setTypeCreateProjectSalesDialog([
          { id: id, type: contactResource },
          { id: data?.accountName?.optionValue, type: accountResource }
        ]);
        setCustomizedRoutes([contactBreadcrumb, { title: [data.firstName, data.lastName].filter((d) => d).join(' ') }]);
        let orgChartData = [];
        let excludeContacts = [];
        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          data.parentHierarchy.map((d) => {
            excludeContacts.push(d._id);
            orgChartData.push({
              id: d._id,
              name: [data?.firstName, data?.middleName, data?.lastName].filter((d) => d).join(' '),
              parentId: d.reportsTo ? d.reportsTo : 0,
              logo: d.contactLogo,
              email: d.email,
              phone: d.phone,
              current: false
            });
          });
        }
        excludeContacts.push(data._id);
        getContacts(excludeContacts, data);
        orgChartData.push({
          id: data._id,
          name: [data?.firstName, data?.middleName, data?.lastName].filter((d) => d).join(' '),
          parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
          logo: data.contactLogo,
          email: data.email,
          phone: data.phone,
          current: true
        });
        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource[contactResource], data));
        setAllowedToDelete(checkIsAllowedToDelete(user, sidebarResource[contactResource], data?.owner?.optionValue));
        setOrgChartData(orgChartData);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const getContacts = (excludeContacts = [], contactData) => {
    axiosInstance()
      .get(`${contactApi}?entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          if (excludeContacts.indexOf(u._id) >= 0) {
            u.isExclude = true;
          } else {
            u.isExclude = false;
          }
          return u;
        });
        let name = [contactData?.firstName, contactData?.firstName, contactData?.middleName, contactData?.lastName].filter((d) => d).join(' ');
        let currentContact = {
          ...contactData,
          isExclude: true,
          concatedName: name
        };
        contactData &&
          setContactsList([currentContact, ...rows].filter((d) => d?.accountName?.optionValue === contactData?.accountName?.optionValue));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleUpdateOrgData = ({ addContact, reportsToContact }) => {
    if (addContact?._id && reportsToContact?._id) {
      const contactFieldData = contactFields.map((f) => {
        return f.fieldData;
      });
      const updatedData = {
        ...getObjKeysWithValues(addContact, contactFieldData),
        reportsTo: reportsToContact?._id,
        _id: addContact?._id
      };
      handleUpdateContact(updatedData, true);
    }
  };

  const handleUpdateChart = (draggedNode, dropNode) => {
    let draggedNodeData = {};
    contactsList.forEach((o) => {
      if (draggedNode.id === o._id) {
        draggedNodeData = {
          ...o,
          reportsTo: dropNode.id
        };
      }
    });

    const contactFieldData = contactFields.map((f) => {
      return f.fieldData;
    });

    const updatedData = {
      ...getObjKeysWithValues(draggedNodeData, contactFieldData),
      _id: draggedNodeData['_id']
    };
    if (updatedData && updatedData['reportsTo'] && updatedData['reportsTo'] === '0') {
      delete updatedData['reportsTo'];
    }
    handleUpdateContact(updatedData, true);
  };

  const fetchRelatedData = () => {
    axiosInstance()
      .get(`/${contactApi}/related/${id}`)
      .then(({ data: { data } }) => {
        setOpportunities(
          data.Opportunity && data.Opportunity[sidebarResource[contactResource].replaceAll(' ', '_')]
            ? data.Opportunity[sidebarResource[contactResource].replaceAll(' ', '_')]
            : []
        );

        setProjectSales(
          data[sidebarResource.projectSales] && data[sidebarResource.projectSales][sidebarResource[contactResource].replaceAll(' ', '_')]
            ? data[sidebarResource.projectSales][sidebarResource[contactResource].replaceAll(' ', '_')]
            : []
        );

        setQuotes(
          data[sidebarResource.quoteBuilder] && data[sidebarResource.quoteBuilder][sidebarResource[contactResource].replaceAll(' ', '_')]
            ? data[sidebarResource.quoteBuilder][sidebarResource[contactResource].replaceAll(' ', '_')]
            : []
        );
      });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: 'Org Chart',
      onClick: () => {
        setOrgChartInFullScreenDialog(true);
      },
      icon: <AccountHierarchyIcon width={42} height={42} />,
      show: true,
      class: 'account'
    }
  ].filter((d) => d.show);

  const getContactFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource[contactResource]}`)
      .then(({ data: { data } }) => {
        setContactFields(data.filter((d) => d.isUpdate || d.isRead));
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
          if (d.fieldData.sectionName === processSteps?.fieldData.additionalInfoSection && sectionFields.length === 0) {
            setSectionFields((prevItems) => {
              return [...prevItems, d];
            });
            setAdditionalFieldName(d.fieldData.sectionName);
          }
        });
      });
  };

  const handleDeleteContact = () => {
    if (contactData?._id) {
      axiosInstance()
        .put(`/${contactApi}/remove`, { ids: [contactData._id] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
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

  const goBackToListing = () => {
    history.push(`/${contactRoute}`);
  };

  const handleAllowToEditList = (contactDetails) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit = contactDetails.owner?.optionValue && contactDetails.owner.optionValue === userId;

      if (!allowToEdit && contactDetails.collaborator && contactDetails.collaborator.length > 0) {
        allowToEdit = contactDetails.collaborator.findIndex((d) => d?.optionValue === userId) > -1;
      }

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleOpneUpdateDialog = () => {
    if (activeStep === steps.length - 1) {
      setShowAtLast(true);
    }
    setOpenUpdateDialog(true);
  };

  const handleSave = (data) => {
    setShowAtLast(true);
    setOpenAdditionalDialog(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    let processFieldName = '';
    const contactFieldData = contactFields.map((f) => {
      if (f.fieldData.type === 'process') {
        processFieldName = f.fieldData.fieldName;
      }
      return f.fieldData;
    });

    const updatedContactData = {
      ...contactData,
      ...data
    };

    const updatedData = {
      ...getObjKeysWithValues(updatedContactData, contactFieldData),
      [processFieldName]: steps[tempActiveStep].text,
      _id: contactData._id
    };

    axiosInstance()
      .put(`${contactApi}`, updatedData)
      .then(() => {
        fetchContactData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMarkAsCompleted = (data) => {
    setShowAtLast(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    if (tempActiveStep === steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = '';
      const contactFieldData = contactFields.map((f) => {
        if (f.fieldData.type === 'process') {
          processFieldName = f.fieldData.fieldName;
        }
        return f.fieldData;
      });

      const updatedData = {
        ...getObjKeysWithValues(contactData, contactFieldData),
        [processFieldName]: steps[tempActiveStep].text,
        _id: contactData._id
      };

      axiosInstance()
        .put(`${contactApi}`, updatedData)
        .then(() => {
          fetchContactData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleUpdateContact = (values, isUpdateReportsTo = false, isFetch = true) => {
    if (values.employees) {
      values.employees = parseInt(values.employees);
    }
    let updatedData = { ...values };

    if (!isUpdateReportsTo) {
      updatedData = {
        ...updatedData,
        _id: contactData._id
      };
    }
    setIsSubmitting(true);
    axiosInstance()
      .put(`/${contactApi}`, updatedData)
      .then(({ data }) => {
        if (isFetch) fetchContactData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (showAddContact) setShowAddContact(false);
        setOpenUpdateDialog(false);
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const handlePortalAccess = () => {
    setShowEntityRoleDialog(true);
  };

  const handleEcommerceAccess = async () => {
    axiosInstance()
      .put('/user/eCommerce-access', {
        eCommerceAccess: true,
        ids: [id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchContactData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  let filteredContactFields = contactFields.filter((item) => item.fieldData.sectionName != additionalFieldName);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.eCommercePolicy?.isRead &&
              contactResource === customerContact.contactResource &&
              contactPermissions?.isUpdate &&
              allowedToEdit && (
                <HtmlTooltip title="E-Commerce Access" arrow placement="top">
                  <Button
                    size="small"
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    disabled={contactData.relatedUser?.eCommerceAccess}
                    onClick={handleEcommerceAccess}
                    className={'btn-outline-v1'}
                  >
                    {isMobile && !isTablet ? <HiShoppingCart /> : 'E-Commerce Access'}
                  </Button>
                </HtmlTooltip>
              )}
            {contactPermissions?.isUpdate && allowedToEdit && (
              <HtmlTooltip title="Give Portal Access" arrow placement="top">
                <Button
                  size="small"
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  disabled={contactData?.isUserExist}
                  onClick={handlePortalAccess}
                  className={'btn-outline-v1'}
                >
                  {isMobile && !isTablet ? <RiLayoutFill /> : 'Give Portal Access'}
                </Button>
              </HtmlTooltip>
            )}
            {contactPermissions?.isUpdate && allowedToEdit && (
              <HtmlTooltip title="Edit" arrow placement="top">
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  size="small"
                  onClick={handleOpneUpdateDialog}
                  className={'btn-outline-v1'}
                >
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              </HtmlTooltip>
            )}
            {contactPermissions?.isDelete && allowedToDelete && (
              <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowConfirmBox(true)} />
            )}
            <ActivityButton
              referenceId={contactData?._id}
              resource={contactResource}
              resourceLabel={`${contactData?.firstName} ${contactData?.lastName}`}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <ProcessFlow
          disableBackNext={contactPermissions?.isUpdate && allowedToEdit ? false : true}
          steps={steps}
          activeStep={activeStep}
          handleMarkAsCompleted={handleMarkAsCompleted}
        />
        <Box>
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
              <CustomTabs
                className="new-tab-container-v1"
                value={currentTabIndex}
                onChange={(index, newValue) => {
                  setCurrentTabIndex(newValue);
                }}
                textColor="primary"
              >
                <CustomTab value={0} label={'Details'} />
                <CustomTab value={1} label={'Org Charts'} />
                {contactResource === 'customerContact' && permissions?.productInventory && <CustomTab value={2} label={'Plants'} />}
              </CustomTabs>
              <TabPanel value={currentTabIndex} index={0}>
                {showAtLast ? (
                  <DetailsPage data={contactData} fields={contactFields} />
                ) : (
                  <DetailsPage data={contactData} fields={filteredContactFields} />
                )}
              </TabPanel>
              <TabPanel value={currentTabIndex} index={1}>
                <OrgChartContainer
                  data={orgChartData}
                  onClick={(id) => {
                    history.push(`/${contactApi}/detail/${id}`);
                  }}
                  updateChart={handleUpdateChart}
                  setShowAddContact={setShowAddContact}
                  isInContact={true}
                />
              </TabPanel>
              {contactResource === 'customerContact' && permissions?.productInventory && (
                <Box hidden={currentTabIndex !== 2}>
                  <Warehouse reference={contactResource} api={contactApi} id={id} accountId={contactData?.accountName?.optionValue} />
                </Box>
              )}
            </>
          )}
        </Box>
        <div className={`pt-3 `}>
          {permissions?.opportunity?.isRead && (
            <Box mb={2} id={`opportunityAccordion `}>
              <OpportunityInAccordian
                opportunityPermissions={permissions.opportunity}
                opportunities={opportunities}
                onNewOpportunityAdd={() => {
                  fetchRelatedData();
                }}
                accountId={contactData?.accountName?.optionValue}
                accountName={contactData?.accountName?.optionLabel}
                recordsPerLine={3}
                resource={accountResource}
                isRedirect={false}
                contactId={id}
                contactResource={contactResource}
                isAllowedToUpdate={contactPermissions.isUpdate && allowedToEdit}
              />
            </Box>
          )}
          {permissions?.projectSales?.isRead && accountResource === customerAccount.accountResource && (
            <Box mb={2} id="projectsAccordion">
              <ProjectInAccordion
                recordsPerLine={3}
                projectSales={projectSales}
                type={typeCreateProjectSalesDialog}
                fetchData={fetchRelatedData}
                permissions={permissions}
                isAddProjectSale={true}
                isAllowedToEdit={contactPermissions.isUpdate && allowedToEdit}
                accountId={contactData?.accountName?.optionValue}
                accountName={contactData?.accountName?.optionLabel}
                resource={accountResource}
              />
            </Box>
          )}
          {accountResource === customerAccount.accountResource && permissions?.quoteBuilder?.isRead && (
            <Box mb={2} id="quotesAccordion">
              <QuotesInAccordion
                recordsPerLine={3}
                quotes={quotes}
                fetchData={fetchRelatedData}
                quoteBuilderPermission={permissions.quoteBuilder}
                accountId={contactData?.accountName?.optionValue}
                contactId={id}
                contactName={[`${contactData?.firstName}`, `${contactData?.middleName}`, `${contactData?.lastName}`].filter((d) => d).join(' ')}
                contactResource={contactResource}
                accountResource={accountResource}
                isRenderedInCustomerContact={true}
                isRenderedFromCustomerAccount={true}
                isAllowedToUpdate={contactPermissions.isUpdate && allowedToEdit}
              />
            </Box>
          )}
        </div>

        <Grid item xs={12}>
          <QuickLinks quickLinks={quickLinks} />
        </Grid>

        {contactData?.staticData?.lead && permissions && permissions?.lead && permissions?.lead?.isRead && (
          <Box mt={2}>
            <div className={`single-form-v1`}>
              <div className={`form-head-v1`}>
                <Typography color="primary" component="h3" style={{ margin: '0 10px' }}>
                  Related Lead
                </Typography>
              </div>
              <Box className={`formdata-v1 `}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6} lg={4}>
                    <Paper className="detailListing card-v1">
                      <List>
                        <ListItem>
                          <ListItemAvatar>
                            <div
                              data-initials={[
                                contactData?.staticData?.lead?.firstName?.charAt(0).toUpperCase(),
                                contactData?.staticData?.lead?.lastName?.charAt(0).toUpperCase()
                              ]
                                .filter((f) => f)
                                .join('')}
                            ></div>
                          </ListItemAvatar>
                          <ListItemText
                            className="ml-2"
                            primary={
                              contactData?.staticData?.lead?.entity === selectedEntity ? (
                                <Link className="link f_size p-l2" to={`/lead/detail/${contactData?.staticData?.lead?._id}`}>
                                  {contactData?.staticData?.lead?.concatedName}
                                </Link>
                              ) : hasAccessToEntity(contactData?.staticData?.lead?.entity) ? (
                                <Link
                                  className="link f_size p-l2"
                                  onClick={() => {
                                    handleEntityChange(contactData?.staticData?.lead?.entity);
                                    history.push(`/lead/detail/${contactData?.staticData?.lead?._id}`);
                                  }}
                                >
                                  {contactData?.staticData?.lead?.concatedName}
                                </Link>
                              ) : (
                                <span>{contactData?.staticData?.lead?.concatedName}</span>
                              )
                            }
                            secondary={
                              <React.Fragment>
                                <Typography component="p" variant="body2" className="cardDetail">
                                  {contactData?.staticData?.lead?.title && (
                                    <span className="d-flex align-items-center gap-2">
                                      <FiStar size="15" />
                                      {contactData?.staticData?.lead?.title}
                                    </span>
                                  )}
                                  {contactData?.staticData?.lead?.email && (
                                    <span className="d-flex align-items-center gap-2">
                                      <AiOutlineMail size="15" />
                                      {contactData?.staticData?.lead?.email}
                                    </span>
                                  )}
                                  {contactData?.staticData?.lead?.phone && (
                                    <span className="d-flex align-items-center gap-2">
                                      <BiPhone size="15" />
                                      {contactData?.staticData?.lead?.phone}
                                    </span>
                                  )}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </div>
          </Box>
        )}
      </Box>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Contact ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteContact}
        />
      ) : null}

      {orgChartInFullScreenDialog && (
        <FullScreenDialog
          heading="Org Chart"
          open={orgChartInFullScreenDialog}
          close={() => {
            setOrgChartInFullScreenDialog(false);
          }}
        >
          <OrgChartContainer
            data={orgChartData}
            onClick={(id) => {
              history.push(`/${contactApi}/detail/${id}`);
            }}
            setShowAddContact={setShowAddContact}
            updateChart={handleUpdateChart}
          />
        </FullScreenDialog>
      )}
      {showEntityRoleDialog && (
        <Dialog
          fullWidth
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          maxWidth="xs"
          open={showEntityRoleDialog}
          onClose={() => setShowEntityRoleDialog(false)}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={showEntityRoleDialog}
            onSuccess={() => {
              setShowEntityRoleDialog(false);
              fetchContactData();
            }}
            handleCloseDialog={() => setShowEntityRoleDialog(false)}
            assignedEntity={[]}
            ids={[id]}
            isRenderedFromContact={true}
            regionalRole={false}
            type="entity"
            entityAccessIds={entityAccess}
            roleAccessIds={roleAccessOfLoggedInUser}
            contactResource={contactResource}
          />
        </Dialog>
      )}
      {openAdditionalDialog && (
        <AdditionalDialogPopUp
          open={openAdditionalDialog}
          close={() => setOpenAdditionalDialog(false)}
          handleSave={handleSave}
          title="Additional Information"
          fieldData={sectionFields}
        />
      )}
      {showAddContact ? (
        <AddReportsToContact
          onClose={() => {
            setShowAddContact(false);
          }}
          open={showAddContact}
          contactsList={contactsList}
          isSubmitting={isSubmitting}
          onSubmit={handleUpdateOrgData}
        />
      ) : null}
      {openUpdateDialog && (
        <ManageContactDialog
          contactResource={contactResource}
          contactId={contactData._id}
          contactApi={contactApi}
          isClone={false}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchContactData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default ContactDetailsPage;
