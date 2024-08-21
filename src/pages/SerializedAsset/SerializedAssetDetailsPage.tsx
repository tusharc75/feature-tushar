import { Box, Button, Grid } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BuildIcon from '@material-ui/icons/Build';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { Skeleton } from '@material-ui/lab';
import { round, startCase } from 'lodash';
import moment from 'moment';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdEdit } from 'react-icons/md';
import { RiExchangeBoxFill } from 'react-icons/ri';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  ASSET_STATUS,
  INVENTORY_HISTORY_TYPE,
  INVENTORY_OWNER_TYPE,
  repairJob,
  serializedAsset,
  sidebarResource
} from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import Alarms from '../IotChart/Alarms';
import Current from '../IotChart/Current';
import PerformanceAnalysis from '../IotChart/PerformanceAnalysis';
import Status from '../IotChart/Status';
import ManageRepairJob from '../RepairJob/ManageRepairJob';
import ManageSendOutboundMessage from '../SendOutboundMessage/manageSendOutboundMessage';
import AssetHistory from './AssetHistory';
import CertificationHistory from './CertificationHistory';
import DepreciationHistory from './DepreciationHistory';
import ManageSerializedAsset from './ManageSerializedAsset';
import ReasonDialog from './ReasonDialog';
import StatusChangeFieldDialog from './StatusChangeFieldDialog';
// import DataSimulationDialog from '../IotChart/DataSimulation';

const SerializedAssetDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();

  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);

  const [assetDetails, setAssetDetails] = useState(null);
  const [fields, setFields] = useState([]);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [manualStatus, setManualStatus] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [status, setStatus] = useState('');
  const [statusOptions, setStatusOptions] = useState(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [customField, setCustomField] = useState(null);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [manageSendOutBoundMessageDialog, setManageSendOutBoundMessageDialog] = useState(false);
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [resourceData, setResourceData] = useState(null);
  const [deviceTemplate, setDeviceTemplate] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  // const [openDataSimulationDialog, setOpenDataSimulationDialog] = useState(false);
  const [openStatusChangeFieldDialog, setOpenStatusChangeFieldDialog] = useState({ open: false, statusPolicy: null });

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = () => {
    fetchFields();
    fetchData();
    fetchPolicy();
    fetchAssetStates();
  };

  const handleMainPoints = (data) => {
    let mainPoint = {};
    Object.keys(data).map((stat: any) => (mainPoint[startCase(stat)] = data[stat] ?? 0));
    setMainPoints(mainPoint);
  };

  const fetchAssetStates = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().post(`${serializedAsset.api}/inventory-stats`, { ids: [id] });
      if (data.totalUtilization) {
        data[`totalUtilizationHours`] = `${round(moment.duration(data?.totalUtilization).asHours())}:${Math.floor(
          moment.duration(data?.totalUtilization).asMinutes() % 60
        )}`;
        delete data?.totalUtilization;
      }
      if (data.totalInUseTimeAfterLastRepair) {
        data[`totalInUseTimeAfterLastRepairHours`] = `${round(moment.duration(data?.totalInUseTimeAfterLastRepair).asHours())}:${Math.floor(
          moment.duration(data?.totalInUseTimeAfterLastRepair).asMinutes() % 60
        )}`;
        delete data?.totalInUseTimeAfterLastRepair;
      }
      handleMainPoints(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (deviceTemplate) {
      const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
      const deepFilter = [
        { field: 'active', term: 'yes' },
        { field: 'alarm', term: 'no' }
      ];
      axiosInstance()
        .get(
          `${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&deepFilter=${JSON.stringify(
            deepFilter
          )}&sortBy=order&orderBy=asc&filterType=and`
        )
        .then(({ data: { data } }) => {
          setDataPoints(data?.data);
        });
    }
  }, [deviceTemplate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${serializedAsset.api}/${id}`);
      setHeadingLbl(`${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}`);
      if (history.location.pathname.includes(routes.serializedAssetDetail.path)) {
        setCustomizedRoutes([
          routes.serializedAsset,
          { title: `${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}` }
        ]);
      } else if (history.location.pathname.includes(routes.iotChartDetail.path)) {
        setCustomizedRoutes([
          routes.iotChart,
          { title: `${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}` }
        ]);
      }

      if (data.certificateExpiryDate && new Date(data.certificateExpiryDate) > new Date()) {
        data.certificateAttached = true;
      }
      setAssetDetails({ ...data, currentOwner: data?.currentOwner?.optionLabel });
      setDeviceTemplate(data?.product?.deviceTemplate);
      if (data.status === ASSET_STATUS.scrap) {
        setCustomField({
          fieldData: {
            fieldLabel: 'Scraping Reason',
            fieldName: 'scrapingReason',
            type: 'singleLine',
            sectionName: 'Other Information'
          }
        });
      } else if (data.status === ASSET_STATUS.lost) {
        setCustomField({
          fieldData: {
            fieldLabel: 'Lost Reason',
            fieldName: 'lostReason',
            type: 'singleLine',
            sectionName: 'Other Information'
          }
        });
      }
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setStatusOptions([...o.fieldData.option]);
              setAllowUpdateStatus(o?.isUpdate);
              return true;
            }
          });
          data.data.forEach((element) => {
            if (element?.fieldData?.fieldName === 'currentOwner') {
              element.fieldData.type = 'singleLine';
            }
          });
        }
        setFields(data.data);
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
      .put(`${serializedAsset.api}/remove`, { ids: [] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.serializedAsset.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (o) => {
    const { policy } = resourceData;
    const statusPolicy = policy?.statusChangeFields?.find((ele) => ele.status === o.optionValue);
    setStatus(o.optionValue);
    if (
      (o.optionValue === ASSET_STATUS.available && assetDetails?.status === ASSET_STATUS.scrap) ||
      o.optionValue === ASSET_STATUS.scrap ||
      o.optionValue === ASSET_STATUS.lost
    ) {
      if (statusPolicy) {
        setOpenStatusChangeFieldDialog({ open: true, statusPolicy: statusPolicy })
      } else {
        setShowReasonDialog(true);
      }
    } else {
      if (statusPolicy) {
        setOpenStatusChangeFieldDialog({ open: true, statusPolicy: statusPolicy })
      } else {
        handleStatusUpdate({ status: o.optionValue });
      }
    }
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, { assets: [{ _id: id, currentStatus: assetDetails.status }] })
      .then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchData();
    }
  };

  const handleStatusUpdate = (obj) => {
    setUpdateLoading(true);
    axiosInstance()
      .put(`${serializedAsset.api}/update-status`, {
        assets: [
          {
            _id: assetDetails._id,
            currentStatus: assetDetails?.status
          }
        ],
        status: obj?.status,
        comment: obj?.reason ? obj?.reason : '',
        reference: { _id: assetDetails._id, type: INVENTORY_HISTORY_TYPE.serializedAssets },
        assetData: obj?.assetData
      })
      .then(({ data }) => {
        setUpdateLoading(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        setUpdateLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    if (assetDetails && statusOptions) {
      const otherStatus = [];
      statusOptions?.forEach((o: any) => {
        if (!Object.values(ASSET_STATUS).includes(o.optionLabel)) {
          otherStatus.push(o.optionLabel);
        }
      })

      const systemStatus = [ASSET_STATUS.reserved, ASSET_STATUS.readyToShip, ASSET_STATUS.inTransit, ASSET_STATUS.inUse
        , ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable, ASSET_STATUS.delivered, ASSET_STATUS.customer, ASSET_STATUS.supplier
        , ASSET_STATUS.returned, ASSET_STATUS.repair, ASSET_STATUS.inRepair, ASSET_STATUS.customerPossession, ASSET_STATUS.scrapRequested
      ]

      let tempStatus = [];
      if ([ASSET_STATUS.inTransit, ASSET_STATUS.delivered,
      ASSET_STATUS.inUse, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable,
      ASSET_STATUS.scrapRequested, ASSET_STATUS.inRepair]?.includes(assetDetails.status)) {
        tempStatus = [];
      }
      else if (systemStatus?.includes(assetDetails.status)) {
        tempStatus = [ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert];
      }
      else if ([ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(assetDetails.status)) {
        tempStatus = [ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview,
        ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ...otherStatus];
      }
      else if ([ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(assetDetails.status)) {
        tempStatus = [ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair, ...otherStatus];
      }
      else if (assetDetails.status === ASSET_STATUS.scrap) {
        tempStatus = [ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ...otherStatus];
        if (assetDetails?.currentOwnerType === INVENTORY_OWNER_TYPE.brand) {
          tempStatus.push(ASSET_STATUS.available);
        }
      }
      else if (otherStatus?.includes(assetDetails.status)) {
        tempStatus = [ASSET_STATUS.available, ASSET_STATUS.underReview,
        ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ...otherStatus];
      }
      setManualStatus(tempStatus);
    }
  }, [assetDetails, statusOptions]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {assetDetails ? (
              <>
                {permissions?.sendOutboundMessage?.isCreate && assetDetails?.iotUnit && (
                  <Button
                    variant="outlined"
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={() => {
                      setManageSendOutBoundMessageDialog(true);
                    }}
                  >
                    Send Outbound Message
                  </Button>
                )}
                {/* <Button
                  onClick={() => {
                    setOpenDataSimulationDialog(!openDataSimulationDialog);
                  }}
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Data Simulation
                </Button> */}
                {permissions?.serializedAsset?.isUpdate && assetDetails.active && (
                  <>
                    {permissions?.repairJob?.isCreate &&
                      assetDetails?.currentOwnerType === INVENTORY_OWNER_TYPE.brand &&
                      [ASSET_STATUS.underReview, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(
                        assetDetails?.status
                      ) && (
                        <Button
                          variant={isMobile && !isTablet ? 'text' : 'outlined'}
                          color="default"
                          className="btn-outline-v1"
                          size="small"
                          onClick={() => setShowRepairJobDialog(true)}
                        >
                          {isMobile && !isTablet ? <BuildIcon /> : 'Create Repair Job'}
                        </Button>
                      )}
                    {allowUpdateStatus ? (
                      assetDetails?.status === ASSET_STATUS.lost ? (
                        <Button
                          variant="outlined"
                          color="default"
                          size="small"
                          onClick={() => {
                            setStatus(ASSET_STATUS.available);
                            setShowReasonDialog(true);
                          }}
                          aria-controls="action-menu"
                        >
                          Asset Found
                        </Button>
                      ) : (
                        <Button
                          variant={'outlined'}
                          color="default"
                          size="small"
                          onClick={openActions}
                          className="btn-outline-v1"
                          disabled={updateLoading}
                          aria-controls="action-menu"
                          endIcon={<ExpandMore />}
                        >
                          {isMobile && !isTablet ? <RiExchangeBoxFill size={24} style={{ color: 'var(--primary-text)' }} /> : 'Change Status'}
                        </Button>
                      )
                    ) : null}
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      className={'btn-outline-v1'}
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      {isMobile && !isTablet ? <MdEdit size={22} /> : 'Edit'}
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      {statusOptions?.map((o) => {
                        return (
                          <MenuItem
                            key={o?.optionValue}
                            disabled={!manualStatus.includes(o?.optionLabel) || o?.optionLabel === assetDetails?.status}
                            onClick={() => {
                              closeActions();
                              handleStatusChange(o);
                            }}
                            value={o}
                          >
                            {o?.optionLabel}
                          </MenuItem>
                        );
                      })}
                    </Menu>
                  </>
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={assetDetails?._id}
              resource={ACTIVITY_RESOURCE.serializedAsset}
              resourceLabel={assetDetails?.assetNumber}
              handleClose={() => {
                fetchData();
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Details</CustomTab>
          {deviceTemplate && assetDetails?.iotUnit && <CustomTab value={1}>Current</CustomTab>}
          {deviceTemplate && assetDetails?.iotUnit && <CustomTab value={2}>Performance Analysis</CustomTab>}
          {deviceTemplate && assetDetails?.iotUnit && <CustomTab value={3}>Alarms</CustomTab>}
          {deviceTemplate && assetDetails?.iotUnit && <CustomTab value={4}>Status</CustomTab>}
          {resourceData && resourceData?.steps?.length && <CustomTab value={5}>Associations</CustomTab>}
          <CustomTab value={6}>History</CustomTab>
          {user?.user?.brandPolicy?.serializedAssetCertification && <CustomTab value={7}>Certification History</CustomTab>}
          {user?.user?.brandPolicy?.serializedAssetDepreciation && <CustomTab value={8}>Depreciation History</CustomTab>}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {assetDetails && <DetailsPageHeader mainPoints={mainPoints} />}
          <Box>
            {loading || !fields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage
                  data={assetDetails}
                  fields={
                    assetDetails?.status && (assetDetails?.status === ASSET_STATUS.scrap || assetDetails?.status === ASSET_STATUS.lost)
                      ? [...fields, customField]
                      : fields
                  }
                />
              </>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Current deviceTemplate={deviceTemplate} assetId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PerformanceAnalysis deviceTemplate={deviceTemplate} assetId={id} dataPoints={dataPoints} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Alarms deviceTemplate={deviceTemplate} assetId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <Status assetId={id} dataPoints={dataPoints} />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <Step
            resourceData={resourceData}
            resourceId={id}
            resource={sidebarResource.serializedAsset}
            data={assetDetails}
            allowedToEdit={permissions?.serializedAsset?.isUpdate}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <AssetHistory id={id} status={assetDetails?.status} resourceData={resourceData} fields={fields} />
        </TabPanel>
        <TabPanel value={tabValue} index={7}>
          <CertificationHistory
            id={id}
            canIssueCertificate={permissions?.serializedAsset?.isUpdate || permissions?.serializedAsset?.isCreate}
            supplierAccount={null}
            assetDetails={assetDetails}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={8}>
          <DepreciationHistory id={id} />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.serializedAsset?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showRepairJobDialog && (
        <ManageRepairJob
          referenceType={sidebarResource.serializedAsset}
          onClose={() => setShowRepairJobDialog(false)}
          referenceData={{ warehouse: assetDetails?.warehouse?.optionValue }}
          onSuccess={(obj) => {
            setShowRepairJobDialog(false);
            handleAddAssetToRepairJob(obj?._id);
            fetchAllData();
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageSerializedAsset
          isClone={false}
          productInventoryId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
      {showReasonDialog && (
        <ReasonDialog
          onClose={() => setShowReasonDialog(false)}
          status={status}
          onAddReason={(reason) => {
            handleStatusUpdate({ status: status, reason: reason });
            setShowReasonDialog(false);
          }}
        />
      )}
      {manageSendOutBoundMessageDialog && (
        <ManageSendOutboundMessage
          assetId={assetDetails?._id || null}
          onSuccess={() => {
            setManageSendOutBoundMessageDialog(false);
          }}
          onClose={() => {
            setManageSendOutBoundMessageDialog(false);
          }}
        />
      )}
      {openStatusChangeFieldDialog.open && (
        <StatusChangeFieldDialog
          fields={fields}
          statusPolicy={openStatusChangeFieldDialog.statusPolicy}
          serializedAssetData={assetDetails}
          productInventoryId={id}
          onClose={() => setOpenStatusChangeFieldDialog({ open: false, statusPolicy: null })}
          onSuccess={(values) => {
            handleStatusUpdate({ status: status, assetData: values });
            setOpenStatusChangeFieldDialog({ open: false, statusPolicy: null })
          }}
        />
      )}
      {/* {openDataSimulationDialog && <DataSimulationDialog onClose={() => setOpenDataSimulationDialog(false)} />} */}
    </Box>
  );
};

export default SerializedAssetDetailsPage;
