import { Box, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaSyncAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import ProcessFlow from '../../components/ProcessFlow';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  getObjKeysWithValues,
  lead,
  processFieldName,
  sidebarResource
} from '../../constants/helpers';
import { leadPage } from '../../routes/Lead';
import axiosInstance from './../../axios/axiosInstance';
import AccordionOfOpportunity from './AccordionOfOpportunity';
import ManageLeadDialog from './ManageLeadDialog/ManageLeadDialog';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Step from 'src/pages/DynamicForm/Step';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const LeadDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();
  const [leadData, setLeadData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [fields, setFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.lead, title: resources?.lead?.titlePlural }]);
  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [sectionFields, setSectionFields] = useState([]);
  const [openAdditionalDialog, setOpenAdditionalDialog] = useState(false);
  const [showAtLast, setShowAtLast] = useState(false);
  const [additionalFieldName, setAdditionalFieldName] = useState('');
  const [leadsPermissions, setLeadsPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });
  const [hasPermissionToConvertToOpportunity, setHasPermissionToConvertToOpportunity] = useState(false);
  const [isLeadAlreadyConvertedToOpportunity, setIsLeadAlreadyConvertedToOpportunity] = useState(false);

  const [convertLeadToOpportunityConfirmationDialog, setConvertLeadToOpportunityConfirmationDialog] = useState({
    open: false,
    id: null,
    leadName: null,
    message: null
  });

  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState<any>(0);
  const [resourceData, setResourceData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { leadResource, leadApi } = lead;
  let { id } = useParams();

  useEffect(() => {
    if (permissions) {
      setLeadsPermissions(permissions[leadResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = fields?.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLocaleLowerCase());
      if (processSteps && processSteps.isRead && leadData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex((d) => d.optionLabel === leadData[processFieldName]);
        setActiveStep(currentStepToShow);

        if (currentStepToShow + 1 >= steps.length) {
          const isAtLastStep = currentStepToShow === steps.length - 1;
          setShowAtLast(isAtLastStep);
          let dontHavePermissions = [];
          if (!permissions['customerAccount'].isCreate) {
            dontHavePermissions.push('Customer Account');
          }
          if (!permissions['customerContact'].isCreate) {
            dontHavePermissions.push('Customer Contact');
          }
          if (!permissions['opportunity'].isCreate) {
            dontHavePermissions.push('Opportunity');
          }
          setHasPermissionToConvertToOpportunity(
            dontHavePermissions.length === 0 &&
              user?.role?.selectedEntity?.policy?.isConvertLeadToOpportunity &&
              allowedToEdit &&
              leadData[processFieldName] &&
              currentStepToShow + 1 >= steps.length
          );
        } else {
          setShowAtLast(false);
        }
      }
    }
  }, [steps, leadData]);

  useEffect(() => {
    fetchData();
    fetchFields();
    fetchPolicy();
  }, [id]);

  const fetchData = async () => {
    axiosInstance()
      .get(`${leadApi}/${id}?entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        setIsLeadAlreadyConvertedToOpportunity(
          data.staticData && data.staticData['convertedToOpportunity'] ? data.staticData['convertedToOpportunity'] : false
        );
        setAllowedToEdit(permissions?.lead?.isUpdate && checkIsAllowedToEdit(user, sidebarResource.lead, data));
        setAllowedToDelete(permissions?.lead?.isDelete && checkIsAllowedToDelete(user, sidebarResource.lead, data.owner.optionValue));
        setLeadData(data);
        setCustomizedRoutes([
          { ...routes.lead, title: resources?.lead?.titlePlural },
          { title: [data.firstName, data.middleName, data.lastName].filter((d) => d).join(' ') || data?.company }
        ]);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=Lead&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        setFields(data);
        const processSteps = data.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
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
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.lead}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDeleteLead = () => {
    if (leadData?._id) {
      setIsDeleting(true);
      axiosInstance()
        .put(`${leadApi}/remove?entity=${selectedEntity}`, {
          ids: [leadData._id]
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          goBackToListing();
          setIsDeleting(false);
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsDeleting(false);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const goBackToListing = () => {
    history.push({
      pathname: leadPage.path
    });
  };

  const handleUpdateLead = (values) => {
    fetchData();
    setOpenUpdateDialog(false);
  };

  const handleOpneUpdateDialog = () => {
    if (activeStep === steps.length - 1) {
      setShowAtLast(true);
    }
    setOpenUpdateDialog(true);
  };

  const convertLeadToOpportunity = () => {
    axiosInstance()
      .post(`${leadApi}/convert`, { ids: [leadData._id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setConvertLeadToOpportunityConfirmationDialog({
          open: false,
          id: null,
          leadName: null,
          message: null
        });
        if (activeStep !== steps.length - 1) {
          setActiveStep(steps.length - 1);
          handleMarkAsCompleted();
        }
        history.push(`${routes.opportunityDetail.path}/${data.data[0]}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = (data) => {
    setShowAtLast(true);
    setOpenAdditionalDialog(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;

    let processFieldName = '';
    const leadFieldData = fields?.map((f) => {
      if (f.fieldData.type == 'process') {
        processFieldName = f.fieldData.fieldName;
      }
      return f.fieldData;
    });

    const updatedLeadData = {
      ...leadData,
      ...data
    };

    const updatedData = {
      ...getObjKeysWithValues(updatedLeadData, leadFieldData),
      [processFieldName]: steps[tempActiveStep].text,
      _id: leadData._id
    };

    axiosInstance()
      .put(`/lead?entity=${selectedEntity}`, updatedData)
      .then(() => {
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMarkAsCompleted = (data = null) => {
    setShowAtLast(false);
    const currentStep = activeStep + 1;
    let tempActiveStep = data && data?.isSetBackStep ? currentStep - 1 : currentStep < steps.length - 1 ? currentStep + 1 : currentStep;
    if (tempActiveStep == steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = '';
      const leadFieldData = fields?.map((f) => {
        if (f.fieldData.type == 'process') {
          processFieldName = f.fieldData.fieldName;
        }
        return f.fieldData;
      });

      const updatedData = {
        ...getObjKeysWithValues(leadData, leadFieldData),
        [processFieldName]: steps[tempActiveStep].text,
        _id: leadData._id
      };

      axiosInstance()
        .put(`/lead?entity=${selectedEntity}`, updatedData)
        .then(() => {
          // setActiveStep(data && data?.isSetBackStep ? tempActiveStep : tempActiveStep + 1)
          // if (steps[tempActiveStep].text.toLowerCase() === "qualified") {
          // }
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  let filteredLeadFields = fields?.filter((item) => item.fieldData.sectionName != additionalFieldName);
  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {!isLeadAlreadyConvertedToOpportunity && hasPermissionToConvertToOpportunity && (
              <>
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={'no-shadow'}
                  onClick={() => {
                    const leadName = [leadData.firstName, leadData.middleName, leadData.lastName].filter((d) => d).join(' ');
                    setConvertLeadToOpportunityConfirmationDialog({
                      open: true,
                      id: leadData._id,
                      leadName: leadName,
                      message: `Are you sure you want to convert ${leadName} to opportunity?`
                    });
                  }}
                >
                  {isMobile && !isTablet ? <FaSyncAlt size={15} /> : 'Convert Lead To Opportunity'}
                </Button>
              </>
            )}
            {leadsPermissions.isUpdate && allowedToEdit && (
              <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpneUpdateDialog} tooltip={'Edit'}>
                {'Edit'}
              </ThemeButton>
            )}
            {leadsPermissions.isDelete && allowedToDelete && !leadData?.staticData?.convertedToOpportunity && (
              <DeleteButton
                text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'}
                disabled={isDeleting}
                onClick={() => setShowConfirmBox(true)}
              />
            )}
            <ActivityButton
              referenceId={leadData?._id}
              resource={ACTIVITY_RESOURCE.lead}
              resourceLabel={`${leadData?.firstName} ${leadData?.lastName}`}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs
          value={tabValue}
          onChange={(index, newValue) => {
            setTabValue(newValue);
          }}
        >
          <CustomTab value={0}>Header</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 1}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <>
            <Box pb={2}>
              <ProcessFlow
                disableBackNext={leadsPermissions.isUpdate && allowedToEdit ? false : true}
                steps={steps}
                activeStep={activeStep}
                handleMarkAsCompleted={handleMarkAsCompleted}
                hideBackButton={isLeadAlreadyConvertedToOpportunity}
                className="stepper-box-layout"
              />
            </Box>
            <div className="bg-white dark:bg-[var(--dark-primary)_!important]">
              {!leadData || !fields?.length ? (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              ) : showAtLast ? (
                <DetailsPage data={leadData} fields={fields} />
              ) : (
                <DetailsPage data={leadData} fields={filteredLeadFields} />
              )}
            </div>
            <Box pt={3}>
              <AccordionOfOpportunity recordsPerLine={3} opportunity={leadData?.staticData?.opportunity} />
            </Box>
          </>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 1}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.lead}
                  data={leadData}
                  allowedToEdit={permissions?.lead?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {convertLeadToOpportunityConfirmationDialog.open && (
        <ConfirmationDialog
          open={convertLeadToOpportunityConfirmationDialog.open}
          message={convertLeadToOpportunityConfirmationDialog.message}
          onClose={() =>
            setConvertLeadToOpportunityConfirmationDialog({
              open: false,
              id: null,
              leadName: null,
              message: null
            })
          }
          onOk={convertLeadToOpportunity}
        />
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
      {openUpdateDialog && (
        <ManageLeadDialog
          open={openUpdateDialog}
          onSuccess={handleUpdateLead}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          isNew={false}
          dataToUpdate={leadData}
          resource={sidebarResource.lead}
          leadId={id}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.lead?.titleSingular?.toLowerCase()} : ${leadData?.concatedName} ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteLead}
          okBtnLoading={isDeleting}
        />
      )}
    </Box>
  );
};

export default LeadDetailsPage;
