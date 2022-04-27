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
import Activity from '../../components/Activity';
import { getObjKeysWithValues, lead, processFieldName, defaultActivityShow } from '../../constants/helpers';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageLeadDialog from './ManageLeadDialog/ManageLeadDialog';
import AccordionOfOpportunity from './AccordionOfOpportunity';
import ProcessFlow from '../../components/ProcessFlow';
import { isMobile, isTablet } from 'react-device-detect';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import queryString from 'query-string';
import { MdDelete, MdEdit } from "react-icons/md";
import { FaFunnelDollar } from "react-icons/all";
import { BiEdit } from "react-icons/bi";
import contactClass from "../Contact/contact.module.scss";
import accountClass from "../Account/account.module.scss";

const LeadDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
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
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
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

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  // useEffect(() => {
  //   if (id && user) {
  //     fetchLeadData();
  //   }
  // }, [id]);

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
    if (isSmallScreen) {
      setActivityShow(true)
    }
  }, [isSmallScreen])

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

          if (isAllowedToEdit && openEdit === 'true') {
            setOpenUpdateDialog(true);
            const params = new URLSearchParams();
            params.delete('openEdit');
            history.push({ search: params.toString() });
          }
        }).catch(err => {
          setLoading(false);
          toastConfig.setToastConfig(err)
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
      }).catch(err => {
        setLoading(false);
        toastConfig.setToastConfig(err)
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
    <>
      {openUpdateDialog && (
        <ManageLeadDialog
          open={openUpdateDialog}
          onSuccess={handleUpdateLead}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          isNew={false}
          dataToUpdate={leadData}
          leadApi={leadApi}
        />
      )}
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Lead`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteLead}
        />
      ) : null}
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
          <div>
            <Paper style={isMobile ? { width: "98%" } : {}}>
              {!leadData ? (
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
                  logo={leadData?.leadLogo ? leadData.leadLogo : undefined}
                  leadStatus={leadData?.process ?? ''}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {leadsPermissions.isUpdate && allowedToEdit && (
                    <Button
                      variant={isMobile && !isTablet ? "text" : "contained"}
                      color="primary"
                      size="small"
                      onClick={handleOpneUpdateDialog}
                      className={isMobile && !isTablet ? accountClass.mobile_button_layout : ""}
                      style={isMobile && !isTablet ? { color: "#43aeaa" } : {}}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : "Edit"}
                    </Button>
                  )}
                  {!isLeadAlreadyConvertedToOpportunity && hasPermissionToConvertToOpportunity && (
                    <>
                      <Button
                        variant={isMobile && !isTablet ? "text" : "contained"}
                        color="primary"
                        size="small"
                        className={isMobile && !isTablet ? accountClass.mobile_button_layout : ""}
                        style={isMobile && !isTablet ? { color: "var(--warning-light)", borderColor: "var(--warning-light)" } : {}}
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
                        {isMobile && !isTablet ? <FaFunnelDollar size={19} /> : "Convert Lead To Opportunity"}
                      </Button>
                    </>
                  )}
                  {leadsPermissions.isDelete && allowedToDelete && <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : "Delete"} onClick={() => setShowConfirmBox(true)} className={isMobile ? accountClass.mobile_button_layout : ""} />}
                </DetailsPageHeader>
              )}
              <ProcessFlow
                disableBackNext={leadsPermissions.isUpdate && allowedToEdit ? false : true}
                steps={steps}
                activeStep={activeStep}
                handleMarkAsCompleted={handleMarkAsCompleted}
                hideBackButton={isLeadAlreadyConvertedToOpportunity}
                className="stepper-box-layout"
              />
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
              <AccordionOfOpportunity recordsPerLine={3} opportunity={leadData?.staticData?.opportunity} />
              {/* <ProjectInAccordion recordsPerLine={3} projectSales={null}/> */}
              {/* <QuotesInAccordion recordsPerLine={3} /> */}
              {/* <ProductBuilderInAccordion recordsPerLine={3} /> */}
              {/* <LeadInAccordion recordsPerLine={3} /> */}
            </Paper>
          </div>
          <div className="position-relative">
            <Paper style={isMobile ? { marginBottom: "50px" } : {}}>
              {!isMobile && !isTablet && <span className={`${showActivity ? "activityHide" : "activityShow"} cursor-pointer`} onClick={handleActivityHideShow}>
                {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
              </span>}
              <div style={{ display: showActivity ? "block" : "none" }}>
                {!leadData ? (
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
                      restrictedAddActivities={leadsPermissions.isUpdate && allowedToEdit ? [] : ['Attachment', 'Case']}
                      relatedTo={[
                        {
                          type: leadResource,
                          referenceId: leadData._id,
                          access: true
                        }
                      ]}
                      resourceId={leadData._id}
                      resource={leadResource}
                      handleActivityRefresh={() => { }}
                      emails={[leadData?.email ?? '']}
                    />
                  </div>
                )}
              </div>
            </Paper>
          </div>
        </div>
        {convertLeadToOpportunityConfirmationDialog.open ? (
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
        ) : null}

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
      </Fragment>
    </>
  );
};

export default LeadDetailsPage;
