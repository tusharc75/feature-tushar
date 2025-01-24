import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import BuildIcon from '@mui/icons-material/Build';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Skeleton } from '@mui/material';
import { round, startCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { RiExchange2Line } from 'react-icons/ri';
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
  sidebarResource,
  SYSTEM_ASSET_STATUS,
  tabIndexValue
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
import VolumeData from 'src/pages/IotChart/VolumeData';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import WarningIcon from '@mui/icons-material/Warning';
// import DataSimulationDialog from '../IotChart/DataSimulation';
import SendIcon from '@mui/icons-material/Send';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';

const SerializedAssetDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);

  const [assetDetails, setAssetDetails] = useState(null);
  const [fields, setFields] = useState([]);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState({ open: false, assetLogFields: null, updateStatus: null });
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
  const [refreshAssetHistory, setRefreshAssetHistory] = useState(false);

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
        data[`totalUtilizationHours`] = `${round(dayjs.duration(data?.totalUtilization).asHours())}:${Math.floor(
          dayjs.duration(data?.totalUtilization).asMinutes() % 60
        )}`;
        delete data?.totalUtilization;
      }   
      
      if (data.totalInUseTimeAfterLastRepair) {
        if(permissions?.repairOrder?.isRead){
          data[`totalInUseTimeAfterLastRepairHours`] = `${round(dayjs.duration(data?.totalInUseTimeAfterLastRepair).asHours())}:${Math.floor(
            dayjs.duration(data?.totalInUseTimeAfterLastRepair).asMinutes() % 60
          )}`;
        }
        delete data?.totalInUseTimeAfterLastRepair;
      }
      console.log(data)
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
      if (history.location.pathname.includes(routes.serializedAssetDetail.path)) {
        setCustomizedRoutes([{ ...routes.serializedAsset, title: resources?.serializedAsset?.titlePlural }, { title: `${data?.assetNumber ?? ''}` }]);
      } else if (history.location.pathname.includes(routes.iotChartDetail.path)) {
        setCustomizedRoutes([{ ...routes.iotChart, title: resources?.iotChart?.titlePlural }, { title: `${data?.assetNumber ?? ''}` }]);
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
      setRefreshAssetHistory(!refreshAssetHistory);
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
    setOpenUpdateDialog({ open: true, assetLogFields: null, updateStatus: null });
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
        setOpenStatusChangeFieldDialog({ open: true, statusPolicy: statusPolicy });
      } else {
        setShowReasonDialog(true);
      }
    } else {
      if (statusPolicy) {
        setOpenStatusChangeFieldDialog({ open: true, statusPolicy: statusPolicy });
      } else {
        handleStatusUpdate({ status: o.optionValue });
      }
    }
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, { assets: [{ _id: id, currentStatus: assetDetails.status }] })
      .then(({ data }) => {})
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
      });

      let tempStatus = [];
      if (SYSTEM_ASSET_STATUS?.includes(assetDetails.status)) {
        tempStatus = [];
      } else if ([ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(assetDetails.status)) {
        tempStatus = [
          ASSET_STATUS.new,
          ASSET_STATUS.available,
          ASSET_STATUS.underReview,
          ASSET_STATUS.scrap,
          ASSET_STATUS.lost,
          ASSET_STATUS.needRepair,
          ASSET_STATUS.needRecert,
          ...otherStatus
        ];
      } else if ([ASSET_STATUS.needRepair]?.includes(assetDetails.status)) {
        tempStatus = [
          ASSET_STATUS.available,
          ASSET_STATUS.scrap,
          ASSET_STATUS.lost,
          ASSET_STATUS.needRecert,
          ASSET_STATUS.needRepair,
          ...otherStatus
        ];
      } else if ([ASSET_STATUS.needRecert]?.includes(assetDetails.status)) {
        tempStatus = [ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair, ...otherStatus];
      } else if (assetDetails.status === ASSET_STATUS.scrap) {
        tempStatus = [ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ...otherStatus];
        if (assetDetails?.currentOwnerType === INVENTORY_OWNER_TYPE.brand) {
          tempStatus.push(ASSET_STATUS.available);
        }
      } else if (otherStatus?.includes(assetDetails.status)) {
        tempStatus = [
          ASSET_STATUS.available,
          ASSET_STATUS.underReview,
          ASSET_STATUS.scrap,
          ASSET_STATUS.lost,
          ASSET_STATUS.needRepair,
          ASSET_STATUS.needRecert,
          ...otherStatus
        ];
      }
      setManualStatus(tempStatus);
    }
  }, [assetDetails, statusOptions]);

  const openDataChange = () => {
    return (
      [ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview].includes(assetDetails.status) &&
      resourceData?.policy?.dataChangeAssetLogFields?.length
    );
  };

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
                  <ThemeButton
                    iconForMobile={<SendIcon />}
                    onClick={() => {
                      setManageSendOutBoundMessageDialog(true);
                    }}
                    mobileTooltip={`Send Outbound Message`}
                  >
                    Send Outbound Message
                  </ThemeButton>
                )}
                {/* <ThemeButton
                  onClick={() => {
                    setOpenDataSimulationDialog(!openDataSimulationDialog);
                  }}
                >
                  Data Simulation
                </ThemeButton> */}
                {permissions?.serializedAsset?.isUpdate && assetDetails.active && (
                  <>
                    {permissions?.repairJob?.isCreate &&
                      assetDetails?.currentOwnerType === INVENTORY_OWNER_TYPE.brand &&
                      [ASSET_STATUS.underReview, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(
                        assetDetails?.status
                      ) && (
                        <ThemeButton
                          iconForMobile={<BuildIcon />}
                          onClick={() => setShowRepairJobDialog(true)}
                          mobileTooltip={`Create ${resources?.repairJob?.titleSingular}`}
                        >
                          {`Create ${resources?.repairJob?.titleSingular}`}
                        </ThemeButton>
                      )}
                    {openDataChange() && !resourceData?.policy?.dataChangeStatus ? (
                      <HtmlTooltip title={'If you update data from this button it will add log in history'}>
                        <ThemeButton
                          iconForMobile={<EditIcon />}
                          onClick={() =>
                            setOpenUpdateDialog({ open: true, assetLogFields: resourceData.policy.dataChangeAssetLogFields, updateStatus: null })
                          }
                        >
                          Edit Data
                        </ThemeButton>
                      </HtmlTooltip>
                    ) : null}
                    {allowUpdateStatus ? (
                      assetDetails?.status === ASSET_STATUS.lost ? (
                        <ThemeButton
                          iconForMobile={false}
                          onClick={() => {
                            setStatus(ASSET_STATUS.available);
                            setShowReasonDialog(true);
                          }}
                        >
                          Asset Found
                        </ThemeButton>
                      ) : (
                        <ThemeButton
                          onClick={openActions}
                          endIcon={<ExpandMore />}
                          mobileTooltip="Change Status"
                          disabled={updateLoading}
                          iconForMobile={<RiExchange2Line size={24} style={{ color: 'var(--primary-text)' }} />}
                        >
                          {'Change Status'}
                        </ThemeButton>
                      )
                    ) : null}
                    <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip="Edit">
                      Edit
                    </ThemeButton>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
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
                              const { policy } = resourceData;
                              if (policy?.dataChangeStatus === o.optionValue && openDataChange()) {
                                setOpenUpdateDialog({ open: true, assetLogFields: policy.dataChangeAssetLogFields, updateStatus: o });
                              } else {
                                handleStatusChange(o);
                              }
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
          {deviceTemplate && assetDetails?.iotUnit && <CustomTab value={4}>Volume Data</CustomTab>}
          {deviceTemplate && assetDetails?.iotUnit && <CustomTab value={5}>Status</CustomTab>}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 6}>{tab?.tabName}</CustomTab>)}
          <CustomTab value={tabIndexValue(resourceData, 6)}>History</CustomTab>
          {user?.user?.brandPolicy?.serializedAssetCertification && (
            <CustomTab value={tabIndexValue(resourceData, 7)}>Certification History</CustomTab>
          )}
          {user?.user?.brandPolicy?.serializedAssetDepreciation && <CustomTab value={tabIndexValue(resourceData, 8)}>Depreciation History</CustomTab>}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {assetDetails?.currentLocationNotMatchWithGps && (
            <Box className="flex items-center">
              <WarningIcon className="mr-3" fontSize="small" color="error" />
              <h4>Asset location needs to be update in Equipt</h4>
            </Box>
          )}
          {assetDetails && <DetailsPageHeader mainPoints={mainPoints} />}
          <Box>
            {loading || !fields.length ? (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
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
          <VolumeData assetId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <Status assetId={id} dataPoints={dataPoints} />
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 6}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.serializedAsset}
                  data={assetDetails}
                  allowedToEdit={permissions?.serializedAsset?.isUpdate}
                />
              </TabPanel>
            );
          })}
        <TabPanel value={tabValue} index={tabIndexValue(resourceData, 6)}>
          <AssetHistory id={id} refresh={refreshAssetHistory} resourceData={resourceData} fields={fields} />
        </TabPanel>
        <TabPanel value={tabValue} index={tabIndexValue(resourceData, 7)}>
          <CertificationHistory
            id={id}
            canIssueCertificate={permissions?.serializedAsset?.isUpdate || permissions?.serializedAsset?.isCreate}
            supplierAccount={null}
            assetDetails={assetDetails}
            fetchAssetData={fetchData}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={tabIndexValue(resourceData, 8)}>
          <DepreciationHistory id={id} />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.serializedAsset?.titleSingular?.toLowerCase()} : ${assetDetails?.assetNumber} ?`}
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
      {openUpdateDialog.open && (
        <ManageSerializedAsset
          isClone={false}
          productInventoryId={id}
          onClose={() => {
            setOpenUpdateDialog({ open: false, assetLogFields: null, updateStatus: null });
          }}
          onSuccess={() => {
            if (openUpdateDialog.updateStatus) {
              handleStatusChange(openUpdateDialog.updateStatus);
            }
            setOpenUpdateDialog({ open: false, assetLogFields: null, updateStatus: null });
            fetchData();
          }}
          assetLogFields={openUpdateDialog.assetLogFields}
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
            setOpenStatusChangeFieldDialog({ open: false, statusPolicy: null });
          }}
        />
      )}
      {/* {openDataSimulationDialog && <DataSimulationDialog onClose={() => setOpenDataSimulationDialog(false)} />} */}
    </Box>
  );
};

export default SerializedAssetDetailsPage;
