import { useState, useEffect, useContext } from 'react';
import { Box, Button, Grid, Paper } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useHistory, useParams } from 'react-router-dom';
import TabPanel from '../../components/TabPanel';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import Layout from '../../components/Layout';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import axiosInstance from './../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import { useData } from '../../StateProvider/Provider';
import Activity from '../../components/Activity';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageOpportunityDialog from './ManageOpportunityDialog/ManageOpportunityDialog';
import { Formik, Form } from 'formik';
import { cloneDeep } from 'lodash';
import {
  customerAccount,
  supplierAccount,
  yyyyMMDD,
  stepsToIgnoreManualCompleteForOpportunity,
  supplierContact,
  customerContact,
  getObjKeysWithValues,
  processFieldName,
  formatAmountWithCurrency
} from '../../constants/helpers';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Dialog } from '@material-ui/core';
import { opportunity, sidebarResource } from '../../constants/helpers';
import OpportunityContacts from './OpportunityContacts';
import AssignContactsDialog from './AssignContactsDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import AssignSupplierContactsDialog from './AssignSupplierContactsDialog';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import ProcessFlow from '../../components/ProcessFlow';
import FormTypes from '../../components/Helpers/FormTypes';

import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import { SVG } from '../../assets';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';

const recordsPerLine = 3;
function OpportunityDetailsPage() {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(true);
  const [opportunityData, setOpportunityData] = useState(null);
  const [copyOfOpportunityData, setCopyOfOpportunityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [opportunityFields, setOpportunityFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);

  const [supplierContacts, setSupplierContacts] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [showActivity, setActivityShow] = useState(true);
  const [showAddSupplierContactsDialog, setShowAddSupplierContactsDialog] = useState(false);
  const [showAddCustomerContactsDialog, setShowAddCustomerContactsDialog] = useState(false);
  const [filteredArr, setFilteredArr] = useState([]);
  const [parentLead, setParentLead] = useState({ leadName: '', leadId: '' })
  const [isProcessing, setIsProcessing] = useState(false);

  const [messageDialog, setMessageDialog] = useState({
    open: false,
    message: null
  });
  const [expanded, setExpanded] = useState({
    supplierContacts: true,
    customerContacts: true
  });
  const [supplierAccountOptions, setSupplierAccountOptions] = useState([]);
  const [loadingSupplierAccounts, setLoadingSupplierAccounts] = useState(false);
  const [contactsEmailsData, setContactsEmailsData] = useState([]);
  const [notToBeRemovedContacts, setNotToBeRemovedContacts] = useState([]);

  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [sectionFields, setSectionFields] = useState([]);
  const [openAdditionalDialog, setOpenAdditionalDialog] = useState(false);
  const [showAtLast, setShowAtLast] = useState(false);
  const [additionalFieldName, setAdditionalFieldName] = useState('');

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }

  const handleOpenUpdateDialog = () => {
    if (activeStep === steps.length - 1) {
      setShowAtLast(true);
    }
    setOpenUpdateDialog(true);
  };

  // const closeUpdateDialog = () => {
  //   setOpenUpdateDialog(false);
  // };

  let { id } = useParams();

  const [opportunityPermissions, setOpportunityPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });

  const { opportunityResource, opportunityApi } = opportunity;
  const [projectSales, setProjectSales] = useState([]);
  const [typeCreateProjectSalesDialog, setTypeCreateProjectSalesDialog] = useState([{ id: id, type: opportunity.opportunityResource }]);

  useEffect(() => {
    if (permissions) {
      setOpportunityPermissions(permissions[opportunityResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (id) {
      fetchOpportunityData();
      fetchRelatedData();
    }
  }, [id]);

  useEffect(() => {
    if (
      opportunityData?.staticData?.customerContact &&
      opportunityData.staticData?.customerContact.length &&
      customerContacts &&
      customerContacts.length === 0
    )
      fetchCustomerContactData(false);

    if (
      opportunityData?.staticData?.supplierContact &&
      opportunityData.staticData?.supplierContact.length &&
      supplierContacts &&
      supplierContacts.length === 0
    )
      fetchSupplierContactData(false);
  }, [opportunityData]);

  // useEffect(() => {
  //   if (steps.length > 0) {
  //     const processSteps = opportunityFields.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
  //     if (processSteps && processSteps.isRead && opportunityData) {
  //       setAdditionalFieldName(processSteps.fieldData.additionalInfoSection);
  //       const currentStepToShow = processSteps.fieldData.option.findIndex((d) => d.optionLabel === opportunityData[processFieldName]);
  //       setActiveStep(currentStepToShow);
  //       if (currentStepToShow === steps.length - 1) {
  //         setShowAtLast(true);
  //       } else {
  //         setShowAtLast(false);
  //       }
  //     }
  //   }
  // }, [steps]);

  const fetchOpportunityData = () => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${opportunityApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          let modifiedData = {};
          Object.assign(modifiedData, data);
          modifiedData['estimatedAmount'] = formatAmountWithCurrency(modifiedData['currency'], modifiedData['estimatedAmount']).shortFormatAmount;
          setCopyOfOpportunityData(modifiedData);

          handleMainPoints(data);
          setHeadingLbl(data.opportunityName);

          if (data?.customerAccountName?.optionValue) {
            setTypeCreateProjectSalesDialog((prevState) => [
              ...prevState,
              {
                id: data?.customerAccountName?.optionValue,
                type: 'customerAccount'
              }
            ]);
          }
          if (data?.supplierAccountName?.optionValue) {
            setTypeCreateProjectSalesDialog((prevState) => [
              ...prevState,
              {
                id: data?.supplierAccountName?.optionValue,
                type: 'supplierAccount'
              }
            ]);
          }
          setAllowedToEdit([...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id));

          setOpportunityData(data);
          handleContactsEmails(data);

          if (data?.staticData?.notToBeRemoved && typeof data.staticData.notToBeRemoved === 'object') {
            let ids = [];
            Object.keys(data?.staticData?.notToBeRemoved).map((k) => (ids = [...ids, ...data.staticData.notToBeRemoved[k]]));
            setNotToBeRemovedContacts(ids);
          }

          let tempExpanded = {
            supplierContacts: true,
            customerContacts: true
          };
          if (data?.staticData?.supplierContact && data.staticData.supplierContact.length === 0) {
            tempExpanded.supplierContacts = false;
          }
          if (data?.staticData?.customerContact && data.staticData.customerContact.length === 0) {
            tempExpanded.customerContacts = false;
          }
          setExpanded(tempExpanded);

          getOpportunityFields(data);
          setCustomizedRoutes([routes.opportunity, { title: `${data.opportunityName}` }]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const fetchRelatedData = () => {
    axiosInstance()
      .get(`${opportunityApi}/related/${id}`)
      .then(({ data: { data } }) => {
        setProjectSales(
          data[sidebarResource.projectSales] &&
            data[sidebarResource.projectSales][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            ? data[sidebarResource.projectSales][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            : []
        );

        if (data[sidebarResource.lead] && data[sidebarResource.lead][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]) {
          let tempName = data[sidebarResource.lead][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')][0];
          setParentLead({ leadName: `${tempName.firstName} ${tempName.middleName} ${tempName.lastName}`, leadId: tempName._id })
          // setMainPoints((prevState) => ({
          //   ...prevState,
          //   'Parent Lead': {
          //     leadName: `${tempName.firstName} ${tempName.middleName} ${tempName.lastName}`,
          //     leadId: tempName._id
          //   }
          // }));
        }

        setQuotes(
          data[sidebarResource.quoteBuilder] &&
            data[sidebarResource.quoteBuilder][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            ? data[sidebarResource.quoteBuilder][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            : []
        );
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchSupplierContactData = (showDialog, useAccountList = false, accountList = []) => {
    let ids = [];

    if (opportunityData.supplierAccountName.length > 0 || useAccountList) {
      ids = useAccountList ? accountList.map((d) => d.optionValue) : opportunityData.supplierAccountName.map((d) => d.optionValue);

      const filterById = JSON.stringify([{ field: 'accountName', term: ids.length > 1 ? { $in: ids } : ids[0] }]);
      setLoadingSupplierAccounts(true);
      axiosInstance()
        .get(`supplier-contact?filterById=${filterById}`)
        .then(({ data: { data } }) => {
          let assignedContacts = opportunityData.staticData?.supplierContact ?? [];
          const updatedContacts = [];
          data.forEach((d) => {
            d['isChecked'] = assignedContacts.length > 0 ? assignedContacts.some((item) => item._id === d?._id) : false;
            updatedContacts.push(d);
          });

          setSupplierContacts(updatedContacts);
          setLoadingSupplierAccounts(false);
          if (!useAccountList) setShowAddSupplierContactsDialog(showDialog);
        })
        .catch((error) => {
          setLoadingSupplierAccounts(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      setShowAddSupplierContactsDialog(showDialog);
    }
    // else if (supplierAccountOptions && supplierAccountOptions.length) {
    //   ids = [...supplierAccountOptions.map(option => option.optionValue)]
    // }
  };
  const getContactEmails = (contacts) => {
    return contacts.reduce((emails, contact) => {
      if (contact?.email) emails.push(contact.email);
      return emails;
    }, []);
  };
  const handleContactsEmails = (opportunityData) => {
    let data = [];
    if (opportunityData && opportunityData?.staticData) {
      const { customerContact, supplierContact } = opportunityData?.staticData;
      if (customerContact && customerContact.length) {
        data = getContactEmails(customerContact);
      }
      if (supplierContact && supplierContact.length) {
        data = [...data, ...getContactEmails(supplierContact)];
      }
      if (data.length > 0) setContactsEmailsData(data);
    }
  };

  const handleContactSelection = (e, id) => {
    const indexOfContactToChange = supplierContacts.findIndex((d) => d._id === id);
    supplierContacts[indexOfContactToChange].isChecked = e.target.checked;
    setSupplierContacts([...supplierContacts]);
  };

  const fetchCustomerContactData = (showDialog) => {
    const filterById = JSON.stringify([
      {
        field: 'accountName',
        term: opportunityData?.customerAccountName?.optionValue
      }
    ]);

    axiosInstance()
      .get(`customer-contact?filterById=${filterById}`)
      .then(({ data: { data } }) => {
        let assignedContacts = opportunityData.staticData?.customerContact ?? [];
        const updatedContacts = data.map((d) => {
          d['isChecked'] = assignedContacts.length > 0 ? assignedContacts.some((item) => item._id === d?._id) : false;
          return d;
        });
        setCustomerContacts(updatedContacts);
        setShowAddCustomerContactsDialog(showDialog);
      });
  };

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
    mainPoint['Close Date'] = yyyyMMDD(data.closeDate);
    mainPoint['Estimated Amount'] = data?.estimatedAmount ? formatAmountWithCurrency(data?.currency, data?.estimatedAmount).shortFormatAmount : '';
    mainPoint['Opportunity Owner'] = data?.owner?.optionLabel || '';
    setMainPoints(mainPoint);
  };
  const getOpportunityFields = (passedOpportunityData) => {
    if (selectedEntity) {
      axiosInstance()
        .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          const filteredFields = data.filter((currentField) => currentField.fieldData?.fieldName !== 'supplierAccountName');

          const processSteps = data.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());

          if (data && data.length) {
            let fieldData = data.find((currentField) => currentField?.fieldData?.fieldName === 'supplierAccountName')?.fieldData;
            if (fieldData?.option && fieldData.option.length) {
              setSupplierAccountOptions(
                fieldData.option.map((option) => ({
                  ...option,
                  isSelected: false
                }))
              );
            }
          }

          if (processSteps && processSteps.isRead) {
            data.map((d) => {
              if (d.fieldData.sectionName == processSteps.fieldData.additionalInfoSection && sectionFields.length == 0) {
                setSectionFields((prevItems) => {
                  return [...prevItems, d];
                });
              }
            });

            setAdditionalFieldName(processSteps.fieldData.additionalInfoSection);

            const allProcessSteps = processSteps.fieldData.option.map((m) => {
              return {
                text: m.optionLabel,
                canCompleteManually: !stepsToIgnoreManualCompleteForOpportunity.some((s) => s === m.optionValue.toLowerCase())
              };
            });

            setSteps(allProcessSteps);

            if (allProcessSteps.length > 0) {
              const currentProcessSteps = filteredFields.find(
                (d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase()
              );
              if (currentProcessSteps && currentProcessSteps.isRead && passedOpportunityData) {
                setAdditionalFieldName(currentProcessSteps.fieldData.additionalInfoSection);
                const currentStepToShow = currentProcessSteps.fieldData.option.findIndex(
                  (d) => d.optionLabel === passedOpportunityData[processFieldName]
                );
                setActiveStep(currentStepToShow);
                if (currentStepToShow === allProcessSteps.length - 1) {
                  setShowAtLast(true);
                } else {
                  setShowAtLast(false);
                }

                if (currentStepToShow === allProcessSteps.length - 1) {
                  setOpportunityFields(filteredFields);
                } else {
                  setOpportunityFields(filteredFields.filter((item) => item.fieldData.sectionName !== processSteps.fieldData.additionalInfoSection));
                }
              }
            }
            setLoading(false);
            setShowAdditionalField(processSteps.fieldData.showAdditionalInfoPopup);
          } else {
            setOpportunityFields(filteredFields);
            setLoading(false);
          }
        })

        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleDeleteOpportunity = () => {
    if (opportunityData?._id) {
      axiosInstance()
        .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
          ids: [opportunityData._id]
        })
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
    history.push({
      pathname: routes.opportunity.path
    });
  };

  const handleUpdateOpportunity = (supplierAccounts) => {
    let newFields = [];

    opportunityFields.filter((d) => d.isUpdate).map((_f) => newFields.push(_f.fieldData));

    let values = {
      ...getObjKeysWithValues(opportunityData, newFields),
      supplierAccountName: supplierAccounts,
      _id: opportunityData._id
    };

    axiosInstance()
      .put(`${opportunity.opportunityApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        fetchOpportunityData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAssignContacts = async (newAddedContactId, contactType, contacts) => {
    // allContacts.filter(f => f.isChecked).map(m => m._id)
    let previousIds = [];
    if (contacts) {
      contacts.map((obj) => {
        previousIds.push(obj._id);
      });
    }
    const dataToSave = {
      _id: id,
      supplierContact: contactType === 'supplier' && newAddedContactId ? [newAddedContactId, ...previousIds] : [],
      customerContact: contactType === 'customer' && newAddedContactId ? [newAddedContactId, ...previousIds] : [],
      notToBeRemoved: null
    };

    await axiosInstance()
      .put(`/opportunity/add-contacts`, dataToSave)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          message: data.message,
          type: 'success',
          open: true
        });

        fetchOpportunityData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = (data) => {
    setIsProcessing(true);
    setShowAtLast(true);
    setOpenAdditionalDialog(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;

    let processFieldName = '';
    const opportunityFieldData = opportunityFields.map((f) => {
      if (f.fieldData.type == 'process') {
        processFieldName = f.fieldData.fieldName;
      }
      return f.fieldData;
    });
    const updatedOpportunityData = {
      ...opportunityData,
      ...data
    };

    const updatedOpportunityFields = [...opportunityFieldData, ...sectionFields.map((item) => item.fieldData)]
    const updatedData = {
      ...getObjKeysWithValues(updatedOpportunityData, updatedOpportunityFields),
      [processFieldName]: steps[tempActiveStep].text,
      _id: opportunityData._id
    };

    axiosInstance()
      .put(`/opportunity?entity=${selectedEntity}`, updatedData)
      .then(() => {
        fetchOpportunityData();
        // setActiveStep(activeStep + 1)
        setIsProcessing(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsProcessing(false);
      });
  };

  const handleMarkAsCompleted = (data) => {
    setIsProcessing(true);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    if (tempActiveStep == steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = '';
      const opportunityFieldData = opportunityFields.map((f) => {
        if (f.fieldData.type == 'process') {
          processFieldName = f.fieldData.fieldName;
        }
        return f.fieldData;
      });
      const updatedData = {
        ...getObjKeysWithValues(opportunityData, opportunityFieldData),
        [processFieldName]: steps[tempActiveStep].text,
        _id: opportunityData._id
      };
      axiosInstance()
        .put(`/opportunity?entity=${selectedEntity}`, updatedData)
        .then(() => {
          fetchOpportunityData();
          // setActiveStep(activeStep + 1)
          setIsProcessing(false);
          setShowAtLast(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsProcessing(false);
        });
    }
  };

  let selectedSupplierAccounts = [];
  if (opportunityData?.supplierAccountName && opportunityData.supplierAccountName.length) {
    selectedSupplierAccounts = opportunityData.supplierAccountName.map((s) => s.optionValue);
  }

  let filteredOpportunityFields = opportunityFields.filter((item) => item.fieldData.sectionName != additionalFieldName);

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
        <div>
          <Paper>
            {!opportunityData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <DetailsPageHeader
                heading={headingLbl}
                logo={opportunityData?.leadLogo ? opportunityData.leadLogo : undefined}
                mainPoints={parentLead.leadId ? Object.assign(mainPoints, { 'Parent Lead': parentLead }) : mainPoints}
                showHeading={true}
              >
                {allowedToEdit ? (
                  <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                ) : null}
                {opportunityPermissions.isDelete &&
                  opportunityData?.owner.optionValue &&
                  user?.user?._id &&
                  opportunityData.owner.optionValue === user.user._id ? (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                ) : null}
              </DetailsPageHeader>
            )}

            <ProcessFlow
              disableBackNext={allowedToEdit ? false : true}
              steps={steps}
              activeStep={activeStep}
              handleMarkAsCompleted={handleMarkAsCompleted}
            />
            {/* {loading ? (
                <Box padding={2}>
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : ( */}

            {loading ? (
              <Grid container spacing={2}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i, index) => (
                  <Grid key={index} item sm={6} md={6}>
                    <Skeleton variant="text" width="100px" height="16px" />
                    <Box marginY={1} />
                    <Skeleton width="100%" height="50px" />
                  </Grid>
                ))}
              </Grid>
            ) : !opportunityFields.length ? (
              <Box height="100%" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                <img src={SVG('Opportunity Placeholder')} alt="No Data" />
              </Box>
            ) : (
              <DetailsPage data={copyOfOpportunityData} fields={opportunityFields} />
            )}

            <div className="p-3">
              {opportunityData && (
                <OpportunityContacts
                  contacts={cloneDeep(opportunityData?.staticData?.supplierContact)}
                  title="Supplier Contacts"
                  contactApi={supplierContact.contactApi}
                  isExpanded={expanded.supplierContacts}
                  onAddContact={() => {
                    fetchSupplierContactData(true);
                  }}
                  onSetExpanded={() => {
                    setExpanded({
                      ...expanded,
                      supplierContacts: !expanded.supplierContacts
                    });
                  }}
                  recordsPerLine={recordsPerLine}
                  accounts={cloneDeep(opportunityData?.supplierAccountName)}
                  isAllowedToUpdate={allowedToEdit}
                />
              )}
              {opportunityData && (
                <OpportunityContacts
                  contacts={cloneDeep(opportunityData?.staticData?.customerContact)}
                  title="Customer Contacts"
                  isExpanded={expanded['customerContacts']}
                  contactApi={customerContact.contactApi}
                  onAddContact={() => {
                    fetchCustomerContactData(true);
                  }}
                  onSetExpanded={() => {
                    setExpanded({
                      ...expanded,
                      customerContacts: !expanded.customerContacts
                    });
                  }}
                  recordsPerLine={recordsPerLine}
                  saveContactToOpportunity={handleAssignContacts}
                  accountId={opportunityData?.customerAccountName?.optionValue}
                  isAllowedToUpdate={allowedToEdit}
                />
              )}
              {permissions?.projectSales?.isRead && (
                <ProjectInAccordion
                  recordsPerLine={3}
                  projectSales={projectSales}
                  type={typeCreateProjectSalesDialog}
                  fetchData={fetchRelatedData}
                  permissions={permissions}
                  isAddProjectSale={true}
                  isAllowedToEdit={allowedToEdit}
                />
              )}
              {permissions?.quoteBuilder?.isRead && (
                <QuotesInAccordion
                  recordsPerLine={3}
                  quotes={quotes}
                  fetchData={fetchRelatedData}
                  quoteBuilderPermission={permissions.quoteBuilder}
                  opportunityId={id}
                  accountId={opportunityData?.customerAccountName?.optionValue}
                  opportunityName={opportunityData?.opportunityName}
                  marketSegmentId={opportunityData?.marketSegment?.optionValue}
                  subMarketSegmentId={opportunityData?.subMarketSegment?.optionValue}
                  currency={opportunityData?.currency}
                  estimatedAmount={opportunityData?.estimatedAmount}
                  isRenderedFromOpportunity={true}
                  isAllowedToUpdate={allowedToEdit}
                />
              )}
            </div>
          </Paper>
        </div>
        <div className="position-relative">
          {showActivity ?
            <Paper>
              {!isMobile && !isTablet && <a color="primary" className="activityHide" onClick={handleActivityHideShow}>
                <IoIosArrowDropright className="icon" />
              </a>}
              {!opportunityData ? (
                <Box>
                  <Skeleton variant="text" width="100px" height="25px" />
                  <Box marginY={1} />
                  {[0, 1, 2, 3, 4].map((i, index) => (
                    <Skeleton key={index} width="100%" height="50px" />
                  ))}
                </Box>
              ) : (
                <div>
                  <Activity
                    resourceId={opportunityData?._id}
                    resource={opportunityResource}
                    relatedTo={[
                      {
                        type: opportunityData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
                        referenceId: opportunityData?.customerAccountName
                          ? opportunityData?.customerAccountName?.optionValue
                          : opportunityData?.supplierAccountName?.optionValue,
                        access: false
                      },
                      ...opportunityData?.staticData.customerContact?.map((cc) => ({
                        type: customerContact.contactResource,
                        referenceId: cc._id,
                        access: false
                      })),
                      ...opportunityData?.staticData.supplierContact?.map((sc) => ({
                        type: supplierContact.contactResource,
                        referenceId: sc._id,
                        access: false
                      })),
                      {
                        type: opportunityResource,
                        referenceId: opportunityData?._id,
                        access: true
                      }
                    ]}
                    handleActivityRefresh={() => { }}
                    emails={contactsEmailsData}
                  />
                </div>
              )}
            </Paper>
            :
            !isMobile && !isTablet && <a className="activityShow" onClick={handleActivityHideShow}>
              <IoIosArrowDropleft className="icon" />
            </a>}
        </div>
      </div>

      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this opportunity`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteOpportunity}
        />
      ) : null}
      {/* {openUpdateDialog ? (
            <ManageOpportunity
              isNew={false}
              open={openUpdateDialog}
              onClose={closeUpdateDialog}     
              entityData={{ fields: opportunityFields.map((f) => { return f.fieldData }), initialValues: getObjKeysWithValues(opportunityData, opportunityFields.map((f) => { return f.fieldData })) }}
              handleSubmit={handleUpdateOpportunity}
            />
          ): null} */}

      {openUpdateDialog && (
        <ManageOpportunityDialog
          open={openUpdateDialog}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchOpportunityData();
          }}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          isNew={false}
          dataToUpdate={opportunityData}
          resource={null}
          isRedirectTodetailPage={false}
        // opportunityApi={opportunityApi}
        />
      )}

      {showAddSupplierContactsDialog && (
        <AssignSupplierContactsDialog
          opportunityId={opportunityData._id}
          open={showAddSupplierContactsDialog}
          title="Assign Supplier Contacts"
          onSuccess={() => {
            fetchOpportunityData();
            setShowAddSupplierContactsDialog(false);
          }}
          handleCloseDialog={() => {
            if (selectedSupplierAccounts.length == 0) setSupplierContacts([]);
            setShowAddSupplierContactsDialog(false);
          }}
          contacts={{
            supplierContacts: supplierContacts,
            customerContacts: customerContacts,
            notToBeRemoved: opportunityData?.staticData?.notToBeRemoved
          }}
          contactType="supplier"
          supplierAccountOptions={supplierAccountOptions}
          onGetSupplierAccountsContacts={fetchSupplierContactData}
          onUpdateOpportunity={handleUpdateOpportunity}
          currentContacts={supplierContacts}
          selectedSupplierAccountsList={selectedSupplierAccounts}
          handleContactSelection={handleContactSelection}
          loadingSupplierAccounts={loadingSupplierAccounts}
          notToBeRemovedContacts={notToBeRemovedContacts}
        />
      )}

      {showAddCustomerContactsDialog && (
        <AssignContactsDialog
          opportunityId={opportunityData._id}
          open={showAddCustomerContactsDialog}
          title="Assign Customer Contacts"
          onSuccess={() => {
            fetchOpportunityData();
            setShowAddCustomerContactsDialog(false);
          }}
          handleCloseDialog={() => {
            setShowAddCustomerContactsDialog(false);
          }}
          contacts={{
            supplierContacts: supplierContacts,
            customerContacts: customerContacts,
            notToBeRemoved: opportunityData?.staticData?.notToBeRemoved
          }}
          assignedContacts={opportunityData.staticData?.customerContact ?? []}
          contactType="customer"
          notToBeRemovedContacts={notToBeRemovedContacts}
        />
      )}

      {messageDialog.open && (
        <MessageDialog
          open={messageDialog.open}
          onClose={() => {
            setMessageDialog({ open: false, message: null });
          }}
          message={messageDialog.message}
        />
      )}
      {openAdditionalDialog && (
        <>
          {/* <CustomDialogFooter>
                <Button
                  color="primary"
                  size="small"
                  onClick={() => setOpenAdditionalDialog(false)}
                >
                  Close
                </Button>
                <Button color="primary" size="small" onClick={handleSave}>
                  Save
                </Button>
              </CustomDialogFooter> */}

          <AdditionalDialogPopUp
            open={openAdditionalDialog}
            close={() => setOpenAdditionalDialog(false)}
            title="Additional Information"
            fieldData={sectionFields}
            handleSave={handleSave}
          />
        </>
      )}
    </>
  );
}

export default OpportunityDetailsPage;
