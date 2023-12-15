import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BuildIcon from '@material-ui/icons/Build';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { Skeleton } from '@material-ui/lab';
import { startCase } from 'lodash';
import moment from 'moment';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdEdit } from 'react-icons/md';
import { RiExchangeBoxFill } from 'react-icons/ri';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import TabPanel from 'src/components/TabPanel';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, ASSET_STATUS, INVENTORY_HISTORY_TYPE, INVENTORY_OWNER_TYPE, repairJob, serializedAsset, sidebarResource } from '../../constants/helpers';
import ManageRepairJob from '../RepairJob/ManageRepairJob';
import AssetHistory from './AssetHistory';
import CertificationHistory from './CertificationHistory';
import DepreciationHistory from './DepreciationHistory';
import ManageSerializedAsset from './ManageSerializedAsset';
import ReasonDialog from './ReasonDialog';

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
  const [statusOptions, setStatusOptions] = useState([]);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [customField, setCustomField] = useState(null);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = () => {
    fetchFields();
    fetchData();
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
        data.totalUtilization = Math.floor(moment.duration(data.totalUtilization).asHours());
        if (data.totalUtilization) {
          data.totalUtilization = `${data.totalUtilization} hours`;
        }
      }
      handleMainPoints(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${serializedAsset.api}/${id}`);
      setHeadingLbl(`${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}`);
      setCustomizedRoutes([
        routes.serializedAsset,
        { title: `${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}` }
      ]);
      if (data.certificateExpiryDate && new Date(data.certificateExpiryDate) > new Date()) {
        data.certificateAttached = true;
      }
      setAssetDetails({ ...data, currentOwner: data?.currentOwner?.optionLabel });
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
        history.push(`${routes.serializedAsset.path}`)
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
    if (o.optionValue === ASSET_STATUS.scrap || o.optionValue === ASSET_STATUS.lost) {
      setStatus(o.optionValue);
      setShowReasonDialog(true);
    } else {
      handleStatusUpdate({ status: o.optionValue });
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
        reference: { _id: assetDetails._id, type: INVENTORY_HISTORY_TYPE.serializedAssets }
      })
      .then(() => {
        setUpdateLoading(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${obj?.status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    if (assetDetails) {
      if (assetDetails.status === ASSET_STATUS.underReview) {
        setManualStatus([ASSET_STATUS.available, ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]);
      } else if (assetDetails.status === ASSET_STATUS.scrap) {
        setManualStatus([ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]);
      } else if (assetDetails.status === ASSET_STATUS.lost) {
        setManualStatus([ASSET_STATUS.available, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ASSET_STATUS.scrap]);
      } else {
        setManualStatus([ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]);
      }
    }
  }, [assetDetails]);

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
                {permissions?.iotChart?.isRead && (
                  <Button
                    variant="outlined"
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={() => {
                      window.open(`${routes.iotChart.path}/${assetDetails?._id}`);
                    }}
                  >
                    View Data
                  </Button>
                )}
                {permissions?.serializedAsset?.isUpdate && assetDetails.active && (
                  <>
                    {permissions?.repairJob?.isCreate &&
                      assetDetails?.currentOwnerType === INVENTORY_OWNER_TYPE.brand &&
                      [ASSET_STATUS.underReview, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(
                        assetDetails.status
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
                      assetDetails.status === ASSET_STATUS.lost ? (
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
                      {statusOptions.map((o) => {
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
          <Tab className={'tabLayout'} label={<div className="d-flex align-items-center tab-font">Details</div>} {...a11yProps(0)} />
          <Tab className={'tabLayout'} label={<div className="d-flex align-items-center tab-font">Asset History</div>} {...a11yProps(1)} />
          {user?.user?.brandPolicy?.serializedAssetCertification && (
            <Tab className={'tabLayout'} label={<div className="d-flex align-items-center tab-font">Certification History</div>} {...a11yProps(2)} />
          )}
          {user?.user?.brandPolicy?.serializedAssetDepreciation && (
            <Tab className={'tabLayout'} label={<div className="d-flex align-items-center tab-font">Depreciation History</div>} {...a11yProps(3)} />
          )}
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {assetDetails && <DetailsPageHeader  mainPoints={mainPoints} />}
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
          <AssetHistory id={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <CertificationHistory
            id={id}
            canIssueCertificate={permissions?.serializedAsset?.isUpdate || permissions?.serializedAsset?.isCreate}
            supplierAccount={null}
            assetDetails={assetDetails}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <DepreciationHistory
            id={id}
          />
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
    </Box>
  );
};

export default SerializedAssetDetailsPage;
