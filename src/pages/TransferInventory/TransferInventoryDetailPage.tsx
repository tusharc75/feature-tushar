import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ACTIVITY_RESOURCE, transferInventory } from 'src/constants/helpers';
import ManageTransferInventory from './ManageTransferInventory';
import queryString from 'query-string';
import Steps from 'src/components/Steps';
import { transferInventorySteps, TRANSFER_INVENTORY_STATUS } from 'src/constants/helpers';
import TabPanel from 'src/components/TabPanel';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import Products from './Products';
import SerializesAssets from './SerializesAssets';
import LoadingTicket from './LoadingTicket';
import { camelCase } from 'lodash';
import ContentFullScreen from '../../components/ContentFullScreen';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { isMobile, isTablet } from 'react-device-detect';

const TransferInventoryDetailPage = () => {
  const renderedFrom = camelCase(routes?.transferInventory.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const parsedTab = tab !== undefined ? parseInt(tab) : 1;
  const {
    state: { permissions, user }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [tabValue, setTabValue] = useState(parsedTab);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setDeleting] = useState(false);
  const [transferInventoryData, setTransferInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [transferInventoryFields, setTransferInventoryFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [nextStep, setNextStep] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [stepNames, setStepNames] = useState(transferInventorySteps?.map((item) => item.name));

  const [canReceive, setCanReceive] = useState(false);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    if (id) {
      fetchTransferInventoryData();
    }
  }, [id]);

  const getRessourceFields = () => {
    axiosInstance()
      .get('/field?resource=Transfer Inventory')
      .then(({ data: { data } }) => {
        data?.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions(
              o.fieldData.option?.filter((e) => ![TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inProgress].includes(e.optionValue))
            );
            return true;
          }
        });
        setTransferInventoryFields(data);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const fetchTransferInventoryData = () => {
    axiosInstance()
      .get(`${routes.transferInventory.path}/${id}`)
      .then(({ data: { data } }) => {
        const transferData = data;

        const userEntity = user?.entity?.map((e) => e._id) ?? [];
        if (data?.transferFromPlant?.entity?.length) {
          setCanLoad(data?.transferFromPlant?.entity?.filter((w: any) => userEntity.indexOf(w) > -1)?.length > 0);
        } else {
          setCanLoad(true);
        }

        if (data?.transfertoPlant?.entity?.length) {
          setCanReceive(data?.transfertoPlant?.entity?.filter((w: any) => userEntity.indexOf(w) > -1)?.length > 0);
        } else {
          setCanReceive(true);
        }

        axiosInstance()
          .get(`${routes.transferInventory.path}/${id}/product`)
          .then(({ data: { data } }) => {
            getRessourceFields();
            setHeadingLabel(transferData.transferNumber);
            setCustomizedRoutes([routes.transferInventory, { title: transferData.transferNumber }]);
            setCurrentStep(stepNames.indexOf(transferData?.processStatus) !== -1 ? stepNames.indexOf(transferData?.processStatus) : 0);
            const isAllowedToEdit = [...(transferData.collaborator ?? []), transferData.owner].some((d) => d?.optionValue === user?.user?._id);
            setAllowedToEdit(isAllowedToEdit && permissions?.transferInventory?.isUpdate);
            setTransferInventoryData(transferData);
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance()
      .put(`${transferInventory.api}/remove`, { ids: [id] })
      .then(() => {
        setDeleting(false);
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (_, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const updateStatus = (status: string) => {
    axiosInstance()
      .put(`${routes.transferInventory.path}/${id}/status`, { status })
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status updated ${status} Successfully`
        });
        if (status === TRANSFER_INVENTORY_STATUS.delivered) {
          updateProcessStatus(1);
        }
        fetchTransferInventoryData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const updateProcessStatus = (step: number) => {
    axiosInstance()
      .put(`${routes.transferInventory.path}/${id}/process-status`, {
        processStatus: stepNames[step]
      })
      .then(() => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {allowedToEdit && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
              <Button
                className={'btn-outline-v1'}
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                size="small"
                onClick={handleOpenUpdateDialog}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            <ActivityButton referenceId={transferInventoryData?._id} resource={ACTIVITY_RESOURCE.transferInventory} />
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
            {loading || !transferInventoryData ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={transferInventoryData} fields={transferInventoryFields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {transferInventoryData && (
            <Box>
              <Steps
                steps={transferInventorySteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isNextStep={false}
                nextStep={nextStep}
                updateStatus={updateProcessStatus}
                isStepEnded={transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.delivered}
                setStepFullScreen={() => setStepFullScreen(true)}
              />
              <ContentFullScreen title={stepNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                {stepNames[currentStep] === 'Add Products' && (
                  <Products
                    transferInventoryData={transferInventoryData}
                    setNextStep={setNextStep}
                    renderedFrom={`${renderedFrom}_grid-1`}
                    allowedToEdit={allowedToEdit}
                    updateStatus={updateStatus}
                    fetchTransferInventoryData={fetchTransferInventoryData}
                  />
                )}
                {stepNames[currentStep] === 'Serialized Assets' && (
                  <SerializesAssets
                    transferInventoryData={transferInventoryData}
                    setNextStep={setNextStep}
                    renderedFrom={`${renderedFrom}_grid-2`}
                    allowedToEdit={allowedToEdit}
                    stepFullScreen={stepFullScreen}
                    canLoad={canLoad}
                  />
                )}
                {stepNames[currentStep] === 'Loading Ticket' && (
                  <LoadingTicket
                    transferInventoryData={transferInventoryData}
                    updateStatus={updateStatus}
                    renderedFrom={`${renderedFrom}_grid-3`}
                    allowedToEdit={allowedToEdit}
                    canLoad={canLoad}
                    canReceive={canReceive}
                  />
                )}
              </ContentFullScreen>
            </Box>
          )}
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this transfer inventory: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageTransferInventory
          isClone={false}
          transferInventoryId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchTransferInventoryData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default TransferInventoryDetailPage;
