import { Box, Button, Grid } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps, { getIndex } from 'src/components/Steps';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  bulkAssetCreation,
  bulkAssetCreationSteps,
  checkIsAllowedToEdit,
  getObjKeysWithValues,
  sidebarResource
} from '../../constants/helpers';
import ManageBulkAssetCreation from './ManageBulkAssetCreation';
import Product from './Product';
import SerializedAsset from './SerializedAsset';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';

const BulkAssetCreationDetailsPage = () => {
  const renderedFrom = camelCase(sidebarResource.bulkAssetCreation);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  const [loadingBulkAssetCreation, setLoadingBulkAssetCreation] = useState(false);
  const [bulkAssetCreationData, setBulkAssetCreationData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [bulkAssetCreationFields, setBulkAssetCreationFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [nextStep, setNextStep] = useState(true);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const bulkAssetCreationStepsNames = React.useMemo(() => {
    return bulkAssetCreationSteps.map((item) => item.name);
  }, [bulkAssetCreationSteps]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.replace(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (parsed) {
      history.replace(`?tab=${tabValue}`);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.bulkAssetCreation}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    setLoadingBulkAssetCreation(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${bulkAssetCreation.api}/${id}`);

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.bulkAssetCreation, data));
      setCurrentStep(getIndex(data?.processStatus, bulkAssetCreationSteps));
      setBulkAssetCreationData(data);
      setLoadingBulkAssetCreation(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = () => {
    axiosInstance()
      .get('/field?resource=Bulk Asset Creation')
      .then(({ data }) => {
        setBulkAssetCreationFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${bulkAssetCreation.api}/remove`, { ids: [] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.bulkAssetCreation.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleUpdateData = (obj) => {
    if (obj.status && bulkAssetCreationData?.status !== obj.status && bulkAssetCreationFields.length > 0) {
      const fieldsDataForUpdate = bulkAssetCreationFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(bulkAssetCreationData, fieldsDataForUpdate);
      values['status'] = obj.status;
      values['_id'] = id;
      axiosInstance()
        .put(`${bulkAssetCreation.api}`, values)
        .then(({ data: { data } }) => {
          fetchFields();
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Status changed to ${obj.status}`
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.bulkAssetCreation, title: resources?.bulkAssetCreation?.titlePlural }, { title: `${bulkAssetCreationData?.baNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.bulkAssetCreation?.isUpdate && allowedToEdit && !['Completed']?.includes(bulkAssetCreationData?.status) && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className={'btn-outline-v1'} onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
                </Button>
              )}
              <ActivityButton
                referenceId={bulkAssetCreationData?._id}
                resource={ACTIVITY_RESOURCE.bulkAssetCreation}
                resourceLabel={bulkAssetCreationData?.baNumber}
              />
            </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            Header
          </CustomTab>
          <CustomTab value={1}>
            Details
          </CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loadingBulkAssetCreation || !bulkAssetCreationFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={bulkAssetCreationData} fields={bulkAssetCreationFields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {!bulkAssetCreationData || !bulkAssetCreationFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Steps
                  isNextStep={false}
                  nextStep={nextStep}
                  steps={bulkAssetCreationSteps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isStepEnded={['Completed']?.includes(bulkAssetCreationData?.status)}
                  setStepFullScreen={() => setStepFullScreen(true)}
                  updateStatus={(step: number) => {
                    dynamicFormUpdateProcessStatus(sidebarResource.bulkAssetCreation, bulkAssetCreationSteps[step]?.name, id)
                  }}
                />
                <ContentFullScreen title={bulkAssetCreationStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {currentStep === 0 && (
                    <Product
                      bulkAssetCreationData={bulkAssetCreationData}
                      setNextStep={setNextStep}
                      renderedFrom={`${renderedFrom}_grid-1`}
                      handleUpdateData={handleUpdateData}
                      fetchData={fetchData}
                      allowedToEdit={allowedToEdit}
                    />
                  )}
                  {currentStep === 1 && (
                    <SerializedAsset
                      bulkAssetCreationData={bulkAssetCreationData}
                      renderedFrom={`${renderedFrom}_grid-2`}
                      allowedToEdit={allowedToEdit}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                </ContentFullScreen>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.bulkAssetCreation}
                  data={bulkAssetCreationData}
                  allowedToEdit={permissions?.bulkAssetCreation?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.bulkAssetCreation?.titleSingular?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageBulkAssetCreation
          isClone={false}
          bulkAssetCreationId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default BulkAssetCreationDetailsPage;
