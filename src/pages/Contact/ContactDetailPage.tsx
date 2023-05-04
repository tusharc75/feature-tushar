import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Card, CardContent, Grid, Paper, Tab, Tabs, Typography, List, useMediaQuery, Dialog } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { Skeleton } from '@material-ui/lab';
import { Link } from 'react-router-dom';
import contactClass from './contact.module.scss';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { useData } from '../../StateProvider/Provider';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import axiosInstance from './../../axios/axiosInstance';
import {
  getObjKeysWithValues,
  isObjectEmpty,
  sidebarResource,
  customerAccount,
  processFieldName,
  userType,
  customerContact
} from './../../constants/helpers';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageContact from './ManageContact/index';
import DetailsPage from '../../components/Shared/DetailsPage';
import OrgChartContainer from '../../components/OrgChart/OrgChartContainer';
import QuickLinks, { IQuickLinks } from '../../components/QuickLinks/QuickLinks';
import { FcFlowChart } from 'react-icons/fc';
import FullScreenDialog from '../../components/Helpers/FullScreenDialog';
import BoxWithBorder from '../../components/BoxWithBorder';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { ListItemText } from '@material-ui/core';
import { AiOutlineMail } from 'react-icons/ai';
import { BiEdit, BiPhone } from 'react-icons/bi';
import { FiStar } from 'react-icons/fi';
import OpportunityInAccordian from '../../components/OpportunityInAccordian/OpportunityInAccordian';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import ProcessFlow from '../../components/ProcessFlow';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import routes from '../../components/Helpers/Routes';
import queryString from 'query-string';
import AddReportsToContact from './AddReportsToContact';
import { MdDelete, MdEdit } from 'react-icons/md';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import Warehouse from '../Account/Warehouse';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { AccountHierarchyIcon } from 'src/assets/svg/svgIcons';

const ContactDetailsPage = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);

  const {
    contact: { contactApi, contactResource, contactRoute },
    account: { accountResource, accountApi },
    contactBreadcrumb
  } = props;
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    state: { user, permissions, selectedEntity, tour },
    dispatch
  }: any = useData();

  const [headingLbl, setHeadingLbl] = useState('');
  const [contactData, setContactData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [contactFields, setContactFields] = useState([]);
  const [mainPoints, setMainPoints] = useState({});
  const [allowedToEdit, setAllowedToEdit] = useState(false);
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
  const [canEdit, setCanEdit] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
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
        handleMainPoints(data);
        let name = [data.firstName, data.middleName, data.lastName].filter((d) => d).join(' ');

        if (data?.salutation?.optionLabel) {
          name = data.salutation.optionLabel + name;
        }
        setHeadingLbl(name);
        handleAllowToEditList(data);
        setContactData(data);
        getContactFields();
        setTypeCreateProjectSalesDialog([
          { id: id, type: contactResource },
          { id: data?.accountName?.optionValue, type: accountResource }
        ]);
        setCanEdit([...(data?.collaborator ?? []), data?.owner].some((obj) => obj.optionValue === user.user._id));

        setCustomizedRoutes([contactBreadcrumb, { title: [data.firstName, data.lastName].filter((d) => d).join(' ') }]);

        let orgChartData = [];

        let excludeContacts = [];
        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          data.parentHierarchy.map((d) => {
            excludeContacts.push(d._id);
            orgChartData.push({
              id: d._id,
              name: [d.firstName, d.middleName, d.lastName].filter((d) => d).join(' '),
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
          name: [data.firstName, data.middleName, data.lastName].filter((d) => d).join(' '),
          parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
          logo: data.contactLogo,
          email: data.email,
          phone: data.phone,
          current: true
        });

        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        setAllowedToEdit(isAllowedToEdit);

        if (isAllowedToEdit && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
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
        let name = [contactData.firstName, contactData.middleName, contactData.lastName].filter((d) => d).join(' ');

        if (contactData?.salutation?.optionLabel) {
          name = contactData.salutation.optionLabel + name;
        }
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
      icon: <AccountHierarchyIcon width={23} height={23} />,
      // icon: <TiFlowChildren />,
      show: true,
      class: 'account'
    }
    // {
    //   label: "Projects",
    //   count: 0,
    //   show: true,
    //   icon: <FcMultipleSmartphones />,
    //   class: "project"
    // },
    // {
    //   label: "Opportunity",
    //   count: opportunities ? opportunities.length : 0,
    //   show: permissions?.opportunity?.isRead ?? false,
    //   icon: <FcBinoculars />,
    //   class: "opportunity",
    //   onClick: () => {
    //     history.push({
    //       pathname: `/opportunity`,
    //       state: {
    //         accountId: accountData._id,
    //         accountName: accountData.accountName,
    //       },
    //     });
    //   },
    // },
    // {
    //   label: "Quotes",
    //   count: 0,
    //   show: true,
    //   icon: <BsChatSquareQuoteFill />,
    //   class: "quotes"
    // },
    // {
    //   label: "Accounts Teams",
    //   count: 0,
    //   show: true,
    //   icon: <FcConferenceCall />,
    //   class: "teams"
    // },
    // {
    //   label: "Contacts",
    //   count: relatedContacts ? relatedContacts.length : 0,
    //   icon: <FcContacts />,
    //   class: "contact",
    //   onClick: () => {
    //     history.push({
    //       pathname: `/${contactRoute}`,
    //       state: {
    //         accountId: accountData._id,
    //         accountName: accountData.accountName,
    //       },
    //     });
    //   },
    //   show:
    //     permissions && permissions[contactResource]
    //       ? permissions[contactResource].isRead
    //       : false,
    // },
  ].filter((d) => d.show);

  const handleMainPoints = (data) => {
    let tempMp = {
      phone: data.phone || '',
      email: data.email || '',
      title: data.title || ''
    };
    if (data?.accountName?.optionLabel) {
      tempMp['Account Name'] = data.accountName.optionLabel;
    }

    setMainPoints(tempMp);
  };

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

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
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

  const tourPaths = ['/customer-contact/detail', '/supplier-contact/detail'];

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions.eCommercePolicy?.isRead && contactResource === customerContact.contactResource && (
              <Button
                color="primary"
                size="small"
                variant={isMobile ? 'text' : 'contained'}
                disabled={contactData.relatedUser?.eCommerceAccess}
                onClick={handleEcommerceAccess}
              >
                E-Commerce Access
              </Button>
            )}
            {permissions.eCommercePolicy?.isRead && user.user?.userType === userType.brandAdmin && (
              <Button
                color="primary"
                size="small"
                variant={isMobile ? 'text' : 'contained'}
                disabled={contactData?.isUserExist}
                onClick={handlePortalAccess}
              >
                Give Portal Access
              </Button>
            )}
            {contactPermissions.isUpdate && canEdit ? (
              <Button variant={isMobile ? 'text' : 'contained'} size="small" onClick={handleOpneUpdateDialog} className={'btn-outline-v1'}>
                {isMobile ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            ) : null}

            {contactPermissions.isDelete && contactData?.owner?.optionValue && user?.user?._id && contactData.owner.optionValue === user.user._id ? (
              <DeleteButton text={isMobile ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowConfirmBox(true)} />
            ) : null}
            <ActivityButton referenceId={contactData?._id} resource={contactResource} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <ProcessFlow
          disableBackNext={contactPermissions.isUpdate && canEdit ? false : true}
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
              <Tabs
                className="new-tab-container-v1"
                value={currentTabIndex}
                onChange={(index, newValue) => {
                  setCurrentTabIndex(newValue);
                }}
                textColor="primary"
              >
                <Tab label={<div className="tab-font">Details</div>} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" className="tabLayout" />
                <Tab label={<div className="tab-font">Org Charts</div>} aria-controls="a11y-tabpanel-1" id="a11y-tab-1" className="tabLayout" />
                {!isOffline && contactResource === 'customerContact' && permissions?.productInventory && (
                  <Tab label={<div className="tab-font">Plants</div>} aria-controls="a11y-tabpanel-2" id="a11y-tab-2" className="tabLayout" />
                )}
              </Tabs>
              <Box hidden={currentTabIndex !== 0}>
                {showAtLast ? (
                  <DetailsPage data={contactData} fields={contactFields} />
                ) : (
                  <DetailsPage data={contactData} fields={filteredContactFields} />
                )}
                {/* <DetailsPage data={contactData} fields={contactFields} /> */}
              </Box>
              <Box hidden={currentTabIndex !== 1}>
                <OrgChartContainer
                  data={orgChartData}
                  onClick={(id) => {
                    history.push(`/${contactApi}/detail/${id}`);
                  }}
                  updateChart={handleUpdateChart}
                  setShowAddContact={setShowAddContact}
                  isInContact={true}
                />
              </Box>
              {!isOffline && contactResource === 'customerContact' && permissions?.productInventory && (
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
                isAllowedToUpdate={contactPermissions.isUpdate && canEdit}
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
                isAllowedToEdit={contactPermissions.isUpdate && canEdit}
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
                isAllowedToUpdate={contactPermissions.isUpdate && canEdit}
              />
            </Box>
          )}
        </div>

        <Grid item xs={12}>
          <QuickLinks quickLinks={quickLinks} />
        </Grid>

        {contactData?.staticData?.lead && permissions && permissions.lead && permissions.lead.isRead && (
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
                                    <span className="d-flex gap-2 align-items-center">
                                      <FiStar size="15" />
                                      {contactData?.staticData?.lead?.title}
                                    </span>
                                  )}
                                  {contactData?.staticData?.lead?.email && (
                                    <span className="d-flex gap-2 align-items-center">
                                      <AiOutlineMail size="15" />
                                      {contactData?.staticData?.lead?.email}
                                    </span>
                                  )}
                                  {contactData?.staticData?.lead?.phone && (
                                    <span className="d-flex gap-2 align-items-center">
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
        // <Dialog
        //   disableBackdropClick={true}
        //   fullWidth
        //   maxWidth="sm"
        //   open={openAdditionalDialog}
        //   onClose={() => setOpenAdditionalDialog(false)}
        //   aria-labelledby="form-dialog-title"
        //   fullScreen={isMobile || isTablet}
        // >
        //   <CustomDialogHeader
        //     title="Additonal Information"
        //     onClose={() => setOpenAdditionalDialog(false)}
        //   ></CustomDialogHeader>
        //   {sectionFields.map((item) => (
        //     <CustomDialogContent>{item}</CustomDialogContent>
        //   ))}

        //   <CustomDialogFooter>
        //     <Button
        //       color="primary"
        //       size="small"
        //       onClick={() => setOpenAdditionalDialog(false)}
        //     >
        //       Close
        //     </Button>
        //     <Button color="primary" size="small" onClick={handleSave}>
        //       Save
        //     </Button>
        //   </CustomDialogFooter>
        // </Dialog>
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
      {openUpdateDialog && showAtLast ? (
        // <UpdateDetailsDialog
        //     title={`Editing  ${contactData.firstName}`}
        //     openDialog={openUpdateDialog}
        //     onClose={closeUpdateDialog}
        //     data={contactData}
        //     fields={contactFields}
        //     isUpdating={isUpdating}
        //     handleUpdate={handleUpdateContact}
        // />
        <ManageContact
          isNew={false}
          open={openUpdateDialog}
          onClose={closeUpdateDialog}
          contactData={{
            fields: contactFields.map((f) => {
              return f.fieldData;
            }),
            initialValues: getObjKeysWithValues(
              contactData,
              contactFields.map((f) => {
                return f.fieldData;
              })
            )
          }}
          loading={loading}
          handleSubmit={handleUpdateContact}
          contactId={contactData._id}
          account={props?.account}
          // contactResource={contactResource}
          accountResource={accountResource}
          contactResource={contactResource}
          // contactApi={contactApi}
        />
      ) : openUpdateDialog ? (
        <ManageContact
          isNew={false}
          open={openUpdateDialog}
          onClose={closeUpdateDialog}
          contactData={{
            fields: filteredContactFields.map((f) => {
              return f.fieldData;
            }),
            initialValues: getObjKeysWithValues(
              contactData,
              filteredContactFields.map((f) => {
                return f.fieldData;
              })
            )
          }}
          loading={loading}
          handleSubmit={handleUpdateContact}
          contactId={contactData._id}
          account={props?.account}
          // contactResource={contactResource}
          accountResource={accountResource}
          contactResource={contactResource}
          // contactApi={contactApi}
        />
      ) : null}
    </Box>
  );
};

export default ContactDetailsPage;
