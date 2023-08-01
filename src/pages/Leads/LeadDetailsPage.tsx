import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, Grid, Paper, useMediaQuery } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { Skeleton } from '@material-ui/lab';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import axiosInstance from './../../axios/axiosInstance';
import { leadPage } from '../../routes/Lead';
import routes from '../../components/Helpers/Routes';
import { useData } from '../../StateProvider/Provider';
import { SVG } from '../../assets';
import { getObjKeysWithValues, lead, processFieldName, ACTIVITY_RESOURCE } from '../../constants/helpers';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageLeadDialog from './ManageLeadDialog/ManageLeadDialog';
import AccordionOfOpportunity from './AccordionOfOpportunity';
import ProcessFlow from '../../components/ProcessFlow';
import { isMobile, isTablet } from 'react-device-detect';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import queryString from 'query-string';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FaFunnelDollar } from 'react-icons/all';
import { BiEdit } from 'react-icons/bi';
import accountClass from '../Account/account.module.scss';
import ActivityButton from 'src/components/Activity/ActivityButton';

const LeadDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [leadFields, setLeadFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.lead]);
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

  const { leadResource, leadApi } = lead;
  let { id } = useParams();

  useEffect(() => {
    if (permissions) {
      setLeadsPermissions(permissions[leadResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = leadFields.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLocaleLowerCase());
      if (processSteps && processSteps.isRead && leadData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex((d) => d.optionLabel === leadData[processFieldName]);
        setActiveStep(currentStepToShow);
        if (currentStepToShow == steps.length - 1) {
          setShowAtLast(true);
        } else {
          setShowAtLast(false);
        }
      }
    }
  }, [steps]);

  useEffect(() => {
    fetchLeadData();
  }, [user, selectedEntity]);

  const fetchLeadData = async () => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${leadApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          const userId = user?.user?._id;
          handleMainPoints(data);
          let name = [data.firstName, data.middleName, data.lastName].filter((d) => d).join(' ');
          const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
          setAllowedToEdit(isAllowedToEdit);
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

          const isAllowedToUpdate = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === userId);

          setHasPermissionToConvertToOpportunity(
            dontHavePermissions.length === 0 &&
              user?.user?.permissions?.convertLeadToOpportunity &&
              isAllowedToUpdate &&
              data[processFieldName] &&
              data[processFieldName].toLowerCase() === 'qualified'
          );
          setIsLeadAlreadyConvertedToOpportunity(
            data.staticData && data.staticData['convertedToOpportunity'] ? data.staticData['convertedToOpportunity'] : false
          );

          if (data?.salutation?.optionLabel) {
            name = data.salutation.optionLabel + name;
          }
          setHeadingLbl(name);

          setAllowedToEdit([...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === userId));
          setAllowedToDelete([data.owner].some((d) => d?.optionValue === userId));
          setLeadData(data);
          getLeadFields();
          setCustomizedRoutes([routes.lead, { title: name }]);
        })
        .catch((err) => {
          setLoading(false);
          toastConfig.setToastConfig(err);
        });
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      company: data.company || '',
      title: data.title || '',
      phone: data.phone || '',
      email: data.email || ''
    };
    setMainPoints(tempMp);
  };

  const getLeadFields = () => {
    axiosInstance()
      .get(`/field?resource=Lead&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        setLeadFields(data);

        const processSteps = data.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
        if (processSteps && processSteps.isRead) {
          setSteps(
            processSteps.fieldData.option.map((m) => {
              return {
                text: m.optionLabel,
                canCompleteManually: true //  !stepsToIgnoreManualCompleteForOpportunity.some(s => s === m.optionValue.toLowerCase())
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

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteLead = () => {
    if (leadData?._id) {
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
      pathname: leadPage.path
    });
  };

  const handleUpdateLead = (values) => {
    fetchLeadData();
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
      .post(`${leadApi}/to-opportunity`, { ids: [leadData._id] })
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
    const leadFieldData = leadFields.map((f) => {
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
        fetchLeadData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMarkAsCompleted = (data) => {
    setShowAtLast(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    if (tempActiveStep == steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = '';
      const leadFieldData = leadFields.map((f) => {
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
          fetchLeadData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  let filteredLeadFields = leadFields.filter((item) => item.fieldData.sectionName != additionalFieldName);
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
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  color="primary"
                  size="small"
                  className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                  style={isMobile && !isTablet ? { color: 'var(--warning-light)', borderColor: 'var(--warning-light)' } : {}}
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
                  {isMobile && !isTablet ? <FaFunnelDollar size={19} /> : 'Convert Lead To Opportunity'}
                </Button>
              </>
            )}
            {leadsPermissions.isUpdate && allowedToEdit && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                size="small"
                onClick={handleOpneUpdateDialog}
                className={'btn-outline-v1'}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {leadsPermissions.isDelete && allowedToDelete && (
              <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowConfirmBox(true)} />
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
          ) : !leadFields.length ? (
            <Box height="100%" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
              <img src={SVG('Contacts Placeholder')} alt="No Data" />
            </Box>
          ) : showAtLast ? (
            <DetailsPage data={leadData} fields={leadFields} />
          ) : (
            <DetailsPage data={leadData} fields={filteredLeadFields} />
          )}
        </div>
        <Box pt={3}>
          <AccordionOfOpportunity recordsPerLine={3} opportunity={leadData?.staticData?.opportunity} />
        </Box>
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
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Lead`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteLead}
        />
      )}
    </Box>
  );
};

export default LeadDetailsPage;
