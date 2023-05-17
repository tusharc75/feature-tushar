import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, useMediaQuery, Tab, Tabs } from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
  bulkAssetCreation,
  getObjKeysWithValues,
  supplierAccount,
  customerAccount,
  bulkAssetCreationSteps,
  ACTIVITY_RESOURCE
} from '../../constants/helpers';
import ManageBulkAssetCreation from './ManageBulkAssetCreation';
import { FaCartArrowDown, FaCartPlus, FaSuitcase, FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import Product from './Product';
import HideWhenOffline from '../../components/HideWhenOffline';
import Activity from '../../components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { camelCase } from 'lodash';
import SerializedAsset from './SerializedAsset';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ActivityButton from 'src/components/Activity/ActivityButton';
import Steps, { getIndex } from 'src/components/Steps';

const BulkAssetCreationDetailsPage = () => {
  const renderedFrom = camelCase(routes?.bulkAssetCreation.title);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [loadingBulkAssetCreation, setLoadingBulkAssetCreation] = useState(false);
  const [bulkAssetCreationData, setBulkAssetCreationData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [bulkAssetCreationFields, setBulkAssetCreationFields] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [bulkAssetCreationProduct, setBulkAssetCreationProduct] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [nextStep, setNextStep] = useState(true);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const bulkAssetCreationStepsNames = React.useMemo(() => {
    return bulkAssetCreationSteps.map((item) => item.name);
  }, [bulkAssetCreationSteps]);

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.replace(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 1) {
      updateProcessStatus(bulkAssetCreationSteps[currentStep]);
    }
  }, [currentStep]);

  const updateProcessStatus = async (processStatus) => {
    axiosInstance()
      .put(`${bulkAssetCreation.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {});
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
    }
  }, [id]);

  const fetchData = async () => {
    setLoadingBulkAssetCreation(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${bulkAssetCreation.api}/${id}`);
      const isAllowedToEdit = [...(data?.collaborator ?? []), data?.owner, data?.processor].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setCurrentStep(getIndex(data?.processStatus, bulkAssetCreationSteps));
      setBulkAssetCreationData(data);
      if (isAllowedToEdit && openEdit === 'true') {
        setOpenUpdateDialog(true);
        const params = new URLSearchParams();
        params.delete('openEdit');
        history.push({ search: params.toString() });
      }
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
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setStatusOptions([...o.fieldData.option]);
              return true;
            }
          });
        }
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
        history.goBack();
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
          <CustomBreadCrumbs routes={[routes.bulkAssetCreation, { title: `${bulkAssetCreationData?.baNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.bulkAssetCreation?.isUpdate && allowedToEdit && !['Completed']?.includes(bulkAssetCreationData?.status) && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className={'btn-outline-v1'} onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              <ActivityButton referenceId={bulkAssetCreationData?._id} resource={ACTIVITY_RESOURCE.bulkAssetCreation} />
            </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              display: 'none'
            }
          }}
        >
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Header
              </div>
            }
            {...a11yProps(0)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            {...a11yProps(1)}
          />
        </Tabs>
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
                />
                <ContentFullScreen title={bulkAssetCreationStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {currentStep === 0 && (
                    <Product
                      bulkAssetCreationData={bulkAssetCreationData}
                      setNextStep={setNextStep}
                      setBulkAssetCreationProduct={setBulkAssetCreationProduct}
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
                    />
                  )}
                </ContentFullScreen>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.bulkAssetCreation?.title} ?`}
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
