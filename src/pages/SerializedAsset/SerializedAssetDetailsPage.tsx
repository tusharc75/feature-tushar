import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, Typography, Tab, Tabs, useMediaQuery } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
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
  serializedAsset,
  getObjKeysWithValues,
  INVENTORY_STATUS,
  repairJob,
  INVENTORY_OWNER_TYPE,
  INVENTORY_HISTORY_TYPE
} from '../../constants/helpers';
import ManageSerializedAsset from './ManageSerializedAsset';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import ReasonDialog from './ReasonDialog';
import { ACTIVITY_RESOURCE, defaultActivityShow } from '../../constants/helpers';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateTimeRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import ManageRepairJob from '../RepairJob/ManageRepairJob';
import { Link } from 'react-router-dom';
import NoDataCell from '../../components/Helpers/NoDataCell';
import BoxWithBorder from '../../components/BoxWithBorder';
import ProductHierarchy from '../Product/BOM';
import { FaDiceOne, FaWpforms } from 'react-icons/fa';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import CustomTimeline from '../../components/CustomTimeline';
import { GiAutoRepair, GrStatusInfo } from 'react-icons/all';
import { MdEdit } from 'react-icons/md';
import { camelCase, startCase } from 'lodash';
import moment from 'moment';
import Activity from '../../components/Activity';
import HideWhenOffline from '../../components/HideWhenOffline';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

const SerializedAssetDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.serializedAsset.title);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [headingLbl, setHeadingLbl] = useState('');
  const [loadingProductInventory, setLoadingProductInventory] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [productInventoryData, setProductInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productInventoryFields, setProductInventoryFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [manualStatus, setManualStatus] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [productId, setProductId] = useState(null);
  const [status, setStatus] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [customField, setCustomField] = useState(null);
  const [productInventoryHistoryData, setProductInventoryHistoryData] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const [tabValue, setTabValue] = useState(0);

  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const NameRenderer = (params) => (
    <>
      {params.value ? (
        params.data.type === 'Loading Ticket' ||
        params.data.type === 'Receiving Ticket' ||
        params.data.type === 'Return Ticket' ||
        params.data.type === 'Delivery Ticket' ? (
          <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase() === 'repair' ? (
          <Link className="link" title={params.value} to={`${routes.repairJobDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type === 'Repair Order' ? (
          <Link className="link" title={params.value} to={`${routes.repairOrderDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase() === 'rental' ? (
          <Link className="link" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type === 'Transfer Assets' ? (
          <Link className="link" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase().includes('purchase') ? (
          <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase().includes('sublease') ? (
          <Link className="link" title={params.value} to={`${routes.subleaseDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data?.type === 'Bulk Asset Creation' ? (
          <Link className="link" title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data?.type === 'Transfer Inventory' ? (
          <Link className="link" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : (
          params.value
        )
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateTimeRenderer: DateTimeRenderer
  };

  const columns = [
    { field: 'reference', headerName: 'Reference', show: true, cellRenderer: 'nameRenderer' },
    { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'date', headerName: 'Date & Time', show: true, disabled: true, filter: false, cellRenderer: 'dateTimeRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'comments', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
    { field: 'location', headerName: 'Location', show: true, cellRenderer: 'commonRenderer' },
    { field: 'ownerType', headerName: 'Owner Type', show: true, cellRenderer: 'commonRenderer' },
    { field: 'owner', headerName: 'Owner', show: true, cellRenderer: 'commonRenderer' }
  ];

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = () => {
    fetchFields();
    fetchProductInventoryData();
    fetchProductInventoryHistory();
    fetchProductInventoryStates();
  };

  const handleMainPoints = (data) => {
    let mainPoint = {};
    Object.keys(data).map((stat: any) => (mainPoint[startCase(stat)] = data[stat] ?? 0));
    setMainPoints(mainPoint);
  };

  const fetchProductInventoryHistory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/history/inventory/${id}`)
      .then(({ data: { data } }) => {
        data = data?.map((u, index) => ({
          ...u,
          _id: index + 1,
          id: index + 1,
          reference: u.reference?.optionLabel,
          referenceId: u.reference?.optionValue
        }));
        setProductInventoryHistoryData(data);
        dispatch({ type: 'initialize', data: data, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchProductInventoryStates = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().post(`${serializedAsset.api}/inventory-stats`, { ids: [id] });
      if (data.totalUtilization) {
        data.totalUtilization = moment.duration(data.totalUtilization).hours();
        if (data.totalUtilization) {
          data.totalUtilization = `${data.totalUtilization} hours`;
        }
      }
      handleMainPoints(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchProductInventoryData = async () => {
    setLoadingProductInventory(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${serializedAsset.api}/${id}`);
      setHeadingLbl(`${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}`);
      setCustomizedRoutes([
        routes.serializedAsset,
        { title: `${data?.assetNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ''}` }
      ]);
      setProductId(data?.product?.optionValue);
      setProductInventoryData({ ...data, currentOwner: data?.currentOwner?.optionLabel });
      if (data.status === 'Scrap') {
        setCustomField({
          fieldData: {
            fieldLabel: 'Scraping Reason',
            fieldName: 'scrapingReason',
            type: 'singleLine',
            sectionName: 'Product Inventory'
          }
        });
      } else if (data.status === 'Lost') {
        setCustomField({
          fieldData: {
            fieldLabel: 'Lost Reason',
            fieldName: 'lostReason',
            type: 'singleLine',
            sectionName: 'Product Inventory'
          }
        });
      }
      setLoadingProductInventory(false);
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
        setProductInventoryFields(data.data);
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
        history.goBack();
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
    if (o.optionValue === INVENTORY_STATUS.scrap || o.optionValue === INVENTORY_STATUS.lost) {
      setStatus(o.optionValue);
      setShowReasonDialog(true);
    } else {
      handleStatusUpdate({ status: o.optionValue });
    }
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, { ids: [id] })
      .then(({ data }) => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleStatusUpdate = (obj) => {
    setUpdateLoading(true);
    axiosInstance()
      .put(`${serializedAsset.api}/update-status`, {
        assets: [productInventoryData._id],
        status: obj?.status,
        comment: obj?.reason ? obj?.reason : '',
        reference: { _id: productInventoryData._id, type: INVENTORY_HISTORY_TYPE.serializedAssets }
      })
      .then(() => {
        setUpdateLoading(false);
        fetchProductInventoryData();
        fetchProductInventoryHistory();
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
    if (productInventoryData) {
      if (productInventoryData.status === INVENTORY_STATUS.underReview) {
        setManualStatus([
          INVENTORY_STATUS.available,
          INVENTORY_STATUS.scrap,
          INVENTORY_STATUS.lost,
          INVENTORY_STATUS.needRepair,
          INVENTORY_STATUS.needRecert
        ]);
      } else if (productInventoryData.status === INVENTORY_STATUS.scrap) {
        setManualStatus([INVENTORY_STATUS.lost, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert]);
      } else if (productInventoryData.status === INVENTORY_STATUS.lost) {
        setManualStatus([INVENTORY_STATUS.available, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert, INVENTORY_STATUS.scrap]);
      } else {
        setManualStatus([INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert]);
      }
    }
  }, [productInventoryData]);

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true);
    }
  }, [isSmallScreen]);

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} md={12} lg={12}>
              <Paper>
                {!productInventoryData ? (
                  <div>
                    <Skeleton variant="text" width="150px" height="40px" />
                    <Box display="flex">
                      <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                      <Box marginX={1} />
                      <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    </Box>
                  </div>
                ) : (
                  <DetailsPageHeader heading={headingLbl} mainPoints={mainPoints} showHeading={true}>
                    {permissions?.serializedAsset?.isUpdate && productInventoryData.active && (
                      <>
                        {permissions?.repairJob?.isCreate &&
                          productInventoryData?.currentOwnerType === INVENTORY_OWNER_TYPE.brand &&
                          [INVENTORY_STATUS.underReview, INVENTORY_STATUS.scrap, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(
                            productInventoryData.status
                          ) && (
                            <Button variant="outlined" color="default" size="small" onClick={() => setShowRepairJobDialog(true)}>
                              {isMobile && !isTablet ? <GiAutoRepair size={20} /> : 'Create Repair Job'}
                            </Button>
                          )}
                        {allowUpdateStatus ? (
                          productInventoryData.status === INVENTORY_STATUS.lost ? (
                            <Button
                              variant="outlined"
                              color="default"
                              size="small"
                              onClick={() => handleStatusUpdate({ status: INVENTORY_STATUS.available })}
                              aria-controls="action-menu"
                            >
                              Asset Found
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              color="default"
                              size="small"
                              onClick={openActions}
                              disabled={updateLoading}
                              aria-controls="action-menu"
                              endIcon={isMobile && !isTablet ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                            >
                              {isMobile && !isTablet ? <GrStatusInfo size={20} /> : 'Change Status'}
                            </Button>
                          )
                        ) : null}
                        <Button variant={isMobile && !isTablet ? 'text' : 'outlined'} color="primary" size="small" onClick={handleOpenUpdateDialog}>
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
                                disabled={!manualStatus.includes(o?.optionLabel) || o?.optionLabel === productInventoryData?.status}
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
                  </DetailsPageHeader>
                )}
                <Box display={isMobile ? 'none' : ''}>
                  {loadingProductInventory || !productInventoryFields.length ? (
                    <Grid container spacing={2} style={{ padding: '8px' }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  ) : (
                    <>
                      <DetailsPage
                        data={productInventoryData}
                        fields={
                          productInventoryData?.status && (productInventoryData?.status === 'Scrap' || productInventoryData?.status === 'Lost')
                            ? [...productInventoryFields, customField]
                            : productInventoryFields
                        }
                      />
                    </>
                  )}
                </Box>
                <Grid container spacing={2} style={isMobile ? { display: 'none' } : { display: '' }}>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <div className="detail-box">
                      <div className="detail-box-content">
                        <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                        <h3 className="form-label-style" title="Asset History">
                          Asset History
                        </h3>
                      </div>

                      <Grid item xs={12} sm={12} md={12} lg={12} className="mt-1">
                        {columns ? (
                          <CustomAgGrid
                            columns={columns}
                            dataRows={dataRows}
                            frameworkComponents={frameworkComponents}
                            setGridApi={setGridApi}
                            dispatch={dispatch}
                            rowCount={rowCount}
                            limit={limit}
                            pageSizes={pageSizes}
                            page={page}
                            allowAction={false}
                            allowSelection={false}
                            isClientSideGrid={true}
                            loading={loading}
                            renderedFrom="rentalManagementDetailsPageInventory"
                            refreshGrid={fetchProductInventoryHistory}
                          />
                        ) : (
                          <Box p={2} height={500} bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                          </Box>
                        )}
                      </Grid>
                    </div>
                  </Grid>
                </Grid>
                <Tabs
                  className="quote-tab"
                  value={tabValue}
                  style={isMobile ? { display: '' } : { display: 'none' }}
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
                    style={{
                      background: tabValue === 1 ? 'white' : '',
                      color: tabValue === 1 ? '#163340' : '#163340'
                    }}
                    label={
                      <div className="d-flex align-items-center tab-font">
                        <FaWpforms className="mr-1" fontSize="inherit" /> Header
                      </div>
                    }
                    {...a11yProps(0)}
                  />
                  <Tab
                    className={'tabLayout'}
                    style={{
                      background: tabValue === 2 ? 'white' : '',
                      color: tabValue === 2 ? 'blue' : '#163340',
                      display: 'flex !important'
                    }}
                    label={
                      <div className="d-flex align-items-center tab-font">
                        <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                      </div>
                    }
                    {...a11yProps(1)}
                  />
                  <div className={'uio'}> </div>
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                  <Box display={isMobile ? 'flex' : 'none'}>
                    {loadingProductInventory || !productInventoryFields.length ? (
                      <Grid container spacing={2} style={{ padding: '8px' }}>
                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                      </Grid>
                    ) : (
                      <>
                        <DetailsPage
                          data={productInventoryData}
                          fields={
                            productInventoryData?.status && productInventoryData?.status === 'Scrap'
                              ? [...productInventoryFields, customField]
                              : productInventoryFields
                          }
                        />
                      </>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                      <div className="detail-box">
                        <div className="detail-box-content">
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h3 className="form-label-style" title="Asset History">
                            Asset History
                          </h3>
                        </div>
                        <Grid item xs={12} sm={12} md={12} lg={12} className="mt-1">
                          {!isMobile && columns ? (
                            <CustomAgGrid
                              columns={columns}
                              dataRows={dataRows}
                              frameworkComponents={frameworkComponents}
                              setGridApi={setGridApi}
                              dispatch={dispatch}
                              rowCount={rowCount}
                              limit={limit}
                              pageSizes={pageSizes}
                              page={page}
                              allowAction={false}
                              allowSelection={false}
                              isClientSideGrid={true}
                              loading={loading}
                              renderedFrom={`${renderedFrom}_grid-1`}
                              refreshGrid={fetchProductInventoryHistory}
                            />
                          ) : isMobile ? (
                            <div>
                              <CustomTimeline dataRows={productInventoryHistoryData} />
                            </div>
                          ) : (
                            <Box p={2} height={500} bgcolor="white">
                              <CommonSkeleton lenArray={[...Array(10).keys()]} />
                            </Box>
                          )}
                        </Grid>
                      </div>
                    </Grid>
                  </Grid>
                </TabPanel>
              </Paper>
            </Grid>
          </Grid>
          <div className="position-relative">
            <HideWhenOffline>
              <Paper>
                {!isSmallScreen && (
                  <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                    {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                  </span>
                )}
                <div style={{ display: showActivity || (isSmallScreen && tabValue === 0) ? 'block' : 'none' }}>
                  <Grid container>
                    <Grid item xs={12}>
                      {productInventoryData && (
                        <div>
                          <Activity
                            resourceId={id}
                            resource={ACTIVITY_RESOURCE?.serializedAsset}
                            relatedTo={[
                              {
                                type: ACTIVITY_RESOURCE?.serializedAsset,
                                referenceId: id,
                                access: true
                              }
                            ]}
                            handleActivityRefresh={() => {}}
                            emails={[]}
                          />
                        </div>
                      )}
                    </Grid>
                  </Grid>
                </div>
              </Paper>
            </HideWhenOffline>
          </div>
        </div>
      </Fragment>
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
          refrenceType="Product Inventory"
          onClose={() => setShowRepairJobDialog(false)}
          refrenceData={{ warehouse: productInventoryData?.warehouse?.optionValue }}
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
            fetchProductInventoryData();
          }}
        />
      )}
      {showReasonDialog ? (
        <ReasonDialog
          onClose={() => setShowReasonDialog(false)}
          status={status}
          onAddReason={(reason) => {
            handleStatusUpdate({ status: status, reason: reason });
            setShowReasonDialog(false);
          }}
        />
      ) : null}
    </>
  );
};

export default SerializedAssetDetailsPage;
