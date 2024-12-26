import { Box, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Skeleton } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdDelete } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import routes from '../../components/Helpers/Routes';
import ProcessFlow from '../../components/ProcessFlow';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  customerContact,
  formatAmountWithCurrency,
  getObjKeysWithValues,
  opportunity,
  processFieldName,
  sidebarResource,
  stepsToIgnoreManualCompleteForOpportunity,
  supplierContact,
  yyyyMMDD
} from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from './../../axios/axiosInstance';
import AssignContactsDialog from './AssignContactsDialog';
import AssignSupplierContactsDialog from './AssignSupplierContactsDialog';
import ManageOpportunityDialog from './ManageOpportunityDialog';
import OpportunityContacts from './OpportunityContacts';

import ActivityButton from 'src/components/Activity/ActivityButton';
import { stepIconInterface, StepIconType } from 'src/components/Steps/icons';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Step from '../DynamicForm/Step';
import QuotationInAccordion from 'src/components/QuotationInAccordion/QuotationInAccordion';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useTableReducer } from 'src/components/CustomReactTable';

interface StepInterface extends stepIconInterface {
  text: string;
  canCompleteManually: boolean;
  name: string;
  title: string;
}

const recordsPerLine = 3;

function OpportunityDetailsPage() {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  let { id } = useParams();

  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [loading, setLoading] = useState(true);
  const [opportunityData, setOpportunityData] = useState(null);
  const [copyOfOpportunityData, setCopyOfOpportunityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [opportunityFields, setOpportunityFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [supplierContacts, setSupplierContacts] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [showAddSupplierContactsDialog, setShowAddSupplierContactsDialog] = useState(false);
  const [showAddCustomerContactsDialog, setShowAddCustomerContactsDialog] = useState(false);
  const [parentLead, setParentLead] = useState({ leadName: '', leadId: '' });
  const [resourceData, setResourceData] = useState(null);
  const [currentTabIndex, setCurrentTabIndex] = useState<any>(0);

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

  const getIcon = (name: string): StepIconType => {
    switch (true) {
      case name === 'New':
        return 'add';
        break;
      case name === 'Prospecting':
        return 'prospecting';
        break;
      case name === 'Proposal':
        return 'proposal';
        break;
      case name === 'Negotiating':
        return 'negotiating';
        break;
      case name === 'Closed':
        return 'endIcon';
        break;
      default:
        return 'add';
        break;
    }
  };

  const { opportunityResource, opportunityApi } = opportunity;
  const [projectSales, setProjectSales] = useState([]);
  const [typeCreateProjectSalesDialog, setTypeCreateProjectSalesDialog] = useState([{ id: id, type: opportunity.opportunityResource }]);

  useEffect(() => {
    if (id) {
      fetchData();
      fetchRelatedData();
    }
  }, [id]);

  useEffect(() => {
    if (id && opportunityFields?.length) {
      fetchPolicy();
    }
  }, [id, opportunityFields]);

  useEffect(() => {
    if (
      opportunityData?.staticData?.customerContact &&
      opportunityData?.staticData?.customerContact.length &&
      customerContacts &&
      customerContacts?.length === 0
    )
      fetchCustomerContactData(false);

    if (
      opportunityData?.staticData?.supplierContact &&
      opportunityData?.staticData?.supplierContact?.length &&
      supplierContacts &&
      supplierContacts?.length === 0
    )
      fetchSupplierContactData(false);
  }, [opportunityData]);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${opportunityApi}/${id}?entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        let modifiedData = {};
        Object.assign(modifiedData, data);
        modifiedData['estimatedAmount'] = formatAmountWithCurrency(modifiedData['currency'], modifiedData['estimatedAmount']).fullFormatAmount;
        setCopyOfOpportunityData(modifiedData);

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

        setAllowedToEdit(permissions?.opportunity?.isUpdate && checkIsAllowedToEdit(user, sidebarResource.opportunity, data));
        setAllowedToDelete(permissions?.opportunity?.isDelete && checkIsAllowedToDelete(user, sidebarResource.opportunity, data.owner.optionValue));
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
        setLoading(false);
        fetchFields(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.opportunity}`);
      if (data) {
        const policyFields = data?.policy?.outcomeFields;
        const processSteps = opportunityFields?.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
        if (processSteps && processSteps?.isRead && policyFields) {
          const policyOutcomeFields = opportunityFields?.filter((_field) => [...policyFields]?.includes(_field.fieldData.fieldName));
          setSectionFields(policyOutcomeFields);
        }
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
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
          setParentLead({ leadName: `${tempName.firstName} ${tempName.middleName} ${tempName.lastName}`, leadId: tempName._id });
        }

        setQuotes(
          data[sidebarResource.quoteBuilder] &&
            data[sidebarResource.quoteBuilder][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            ? data[sidebarResource.quoteBuilder][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            : []
        );
        setQuotations(
          data[sidebarResource.quotation] && data[sidebarResource.quotation][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            ? data[sidebarResource.quotation][sidebarResource[opportunity.opportunityResource].replaceAll(' ', '_')]
            : []
        );
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchSupplierContactData = (showDialog, useAccountList = false, accountList = []) => {
    let ids = [];

    if (opportunityData.supplierAccount?.length > 0 || useAccountList) {
      ids = useAccountList ? accountList?.map((d) => d?.optionValue) : opportunityData?.supplierAccount.map((d) => d?.optionValue);

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
        term: opportunityData?.customerAccount?.optionValue
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

  const fetchFields = (passedOpportunityData) => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const filteredFields = data.filter((currentField) => currentField.fieldData?.fieldName !== 'supplierAccount');

        const processSteps = data.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());

        if (data && data.length) {
          let fieldData = data.find((currentField) => currentField?.fieldData?.fieldName === 'supplierAccount')?.fieldData;
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
          const allProcessSteps: StepInterface[] = processSteps.fieldData.option.map((m) => {
            return {
              text: m.optionLabel,
              canCompleteManually: !stepsToIgnoreManualCompleteForOpportunity.some((s) => s === m.optionValue.toLowerCase()),
              name: m.optionLabel,
              title: m.optionLabel,
              icon: getIcon(m.optionLabel)
            };
          });

          setSteps(allProcessSteps);

          if (allProcessSteps.length > 0) {
            const currentProcessSteps = filteredFields.find(
              (d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase()
            );
            if (currentProcessSteps && currentProcessSteps.isRead && passedOpportunityData) {
              const currentStepToShow = currentProcessSteps.fieldData.option.findIndex(
                (d) => d.optionLabel === passedOpportunityData[processFieldName]
              );
              setActiveStep(currentStepToShow);
            }
          }
          setShowAdditionalField(processSteps.fieldData.showAdditionalInfoPopup);
        }
        setOpportunityFields(filteredFields);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
      pathname: routes?.opportunity?.path
    });
  };

  const handleUpdateOpportunity = (supplierAccounts) => {
    let newFields = [];

    opportunityFields.filter((d) => d.isUpdate).map((_f) => newFields.push(_f.fieldData));

    let values = {
      ...getObjKeysWithValues(opportunityData, newFields),
      _id: opportunityData._id
    };

    axiosInstance()
      .put(`${opportunity.opportunityApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAssignContacts = async (newAddedContactId, contactType, contacts) => {
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

        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = (data) => {
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

    const updatedOpportunityFields = [...opportunityFieldData, ...sectionFields.map((item) => item.fieldData)];
    const updatedData = {
      ...getObjKeysWithValues(updatedOpportunityData, updatedOpportunityFields),
      [processFieldName]: steps[tempActiveStep].text,
      _id: opportunityData._id
    };

    axiosInstance()
      .put(`/opportunity?entity=${selectedEntity}`, updatedData)
      .then(() => {
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMarkAsCompleted = (data) => {
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
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  let selectedSupplierAccounts = [];
  if (opportunityData?.supplierAccount && opportunityData.supplierAccount.length) {
    selectedSupplierAccounts = opportunityData.supplierAccount.map((s) => s.optionValue);
  }

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[{ ...routes.opportunity, title: resources?.opportunity?.titlePlural }, { title: opportunityData?.opportunityName }]}
            />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              {opportunityData ? (
                <>
                  {allowedToEdit ? (
                    <ThemeButton
                      iconForMobile={<EditIcon />}
                      onClick={() => {
                        setOpenUpdateDialog(true);
                      }}
                      tooltip={'Edit'}
                    >
                      {'Edit'}
                    </ThemeButton>
                  ) : null}

                  {allowedToDelete ? (
                    <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowConfirmBox(true)} />
                  ) : null}

                  <ActivityButton
                    referenceId={opportunityData?._id}
                    resource={opportunityResource}
                    resourceLabel={opportunityData?.opportunityName}
                  />
                </>
              ) : (
                <Skeleton variant="text" width="150px" height="32px" />
              )}
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <CustomTabs
            value={currentTabIndex}
            onChange={(index, newValue) => {
              setCurrentTabIndex(newValue);
            }}
          >
            <CustomTab value={0}>Details</CustomTab>
            {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 1}>{tab?.tabName}</CustomTab>)}
          </CustomTabs>
          <TabPanel value={currentTabIndex} index={0}>
            <ProcessFlow
              disableBackNext={allowedToEdit ? false : true}
              steps={steps}
              activeStep={activeStep}
              handleMarkAsCompleted={handleMarkAsCompleted}
            />
            {loading || !opportunityFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={copyOfOpportunityData} fields={opportunityFields} />
            )}
            <div className="pt-3 ">
              {opportunityData && permissions?.supplierContact?.isRead && (
                <Box mb={2}>
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
                    accounts={cloneDeep(opportunityData?.supplierAccount)}
                    allowedToEdit={allowedToEdit}
                  />
                </Box>
              )}
              {opportunityData && permissions?.customerContact?.isRead && (
                <Box mb={2}>
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
                    accountId={opportunityData?.customerAccount?.optionValue}
                    allowedToEdit={allowedToEdit}
                  />
                </Box>
              )}
              {permissions?.projectSales?.isRead && (
                <Box mb={2}>
                  <ProjectInAccordion
                    recordsPerLine={3}
                    projectSales={projectSales}
                    type={typeCreateProjectSalesDialog}
                    fetchData={fetchRelatedData}
                    permissions={permissions}
                    isAddProjectSale={true}
                    isAllowedToEdit={allowedToEdit}
                    accountId={opportunityData?._id}
                    accountName={opportunityData?.opportunityName}
                    resource={sidebarResource.opportunity}
                    resources={resources}
                  />
                </Box>
              )}
              {permissions?.quoteBuilder?.isRead && (
                <Box mb={2}>
                  <QuotesInAccordion
                    recordsPerLine={3}
                    quotes={quotes}
                    fetchData={fetchRelatedData}
                    quoteBuilderPermission={permissions.quoteBuilder}
                    opportunityId={id}
                    accountId={opportunityData?.customerAccount?.optionValue}
                    opportunityName={opportunityData?.opportunityName}
                    marketSegmentId={opportunityData?.marketSegment?.optionValue}
                    subMarketSegmentId={opportunityData?.subMarketSegment?.optionValue}
                    currency={opportunityData?.currency}
                    estimatedAmount={opportunityData?.estimatedAmount}
                    isRenderedFromOpportunity={true}
                    allowedToEdit={allowedToEdit}
                  />
                </Box>
              )}
              {permissions?.quotation?.isRead && (
                <QuotationInAccordion
                  recordsPerLine={3}
                  quotations={quotations}
                  fetchData={fetchRelatedData}
                  opportunityData={opportunityData}
                  allowedToEdit={allowedToEdit}
                />
              )}
            </div>
          </TabPanel>
          {resourceData &&
            resourceData?.tabs?.length > 0 &&
            resourceData?.tabs?.map((tab, i) => {
              return (
                <TabPanel value={currentTabIndex} index={i + 1}>
                  <Step
                    tab={tab}
                    resourcePolicyId={resourceData?._id}
                    resourceId={id}
                    resource={sidebarResource.opportunity}
                    data={opportunityData}
                    allowedToEdit={permissions?.opportunity?.isUpdate}
                  />
                </TabPanel>
              );
            })}
        </Box>

        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete ${resources?.opportunity?.titleSingular?.toLowerCase()} : ${opportunityData?.opportunityName || ''} ?`}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteOpportunity}
          />
        ) : null}

        {openUpdateDialog && (
          <ManageOpportunityDialog
            open={openUpdateDialog}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchData();
            }}
            onClose={() => {
              setOpenUpdateDialog(false);
            }}
            isNew={false}
            dataToUpdate={opportunityData}
            resource={sidebarResource.opportunity}
            isRedirectTodetailPage={false}
            opportunityId={opportunityData?._id}
          />
        )}

        {showAddSupplierContactsDialog && (
          <AssignSupplierContactsDialog
            opportunityId={opportunityData._id}
            open={showAddSupplierContactsDialog}
            title="Assign Supplier Contacts"
            onSuccess={() => {
              fetchData();
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
              fetchData();
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
            <AdditionalDialogPopUp
              open={openAdditionalDialog}
              close={() => setOpenAdditionalDialog(false)}
              title="Additional Information"
              fieldData={sectionFields}
              handleSave={handleSave}
            />
          </>
        )}
      </Box>
    </>
  );
}

export default OpportunityDetailsPage;
