import { Box, Menu, MenuItem, TextField } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import WarningIcon from '@mui/icons-material/Warning';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import routes from '../../components/Helpers/Routes';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  INVENTORY_HISTORY_TYPE,
  MATERIAL_TYPE,
  SYSTEM_ASSET_STATUS,
  gridLoadingTimeout,
  prepareDataForGrid,
  repairJob,
  repairOrder,
  serializedAsset,
  sidebarResource
} from '../../constants/helpers';
import axios, { CancelTokenSource } from 'axios';
import ReasonDialog from '../SerializedAsset/ReasonDialog';
import { ExpandMore } from '@mui/icons-material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { RiExchange2Line } from 'react-icons/ri';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';
import ManageRepairJob from 'src/pages/RepairJob/ManageRepairJob';
import StatusChangeRequestDialog from 'src/pages/SerializedAsset/StatusChangeRequestDialog';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const SerializedAssetInspection = () => {
  const renderedFrom = camelCase(sidebarResource.serializedAssetsInspection);

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [subleaseAsset, setSubleaseAsset] = useState(false);
  const [statusOptions, setStatusOptions] = useState(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [status, setStatus] = useState('');
  const [resourceData, setResourceData] = useState(null);
  const [showRepairOrderDialog, setShowRepairOrderDialog] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [serializedAssetStatusChangeRequestFields, setSerializedAssetStatusChangeRequestFields] = useState(null);
  const [openStatusChangeRequestDialog, setStatusChangeRequestDialog] = useState(false);

  useEffect(() => {
    fetchGridColumns();
    fetchFieldSerializedAssetStatusChangeRequest();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, limit, filters, sorting, selectedWarehouse, selectedEntity, subleaseAsset, showFilteredRecordsOnly]);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data['Warehouse']);
      });
  }, [selectedEntity]);

  const fetchGridColumns = async () => {
    const resourceDataResponce = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
    const resourceData = resourceDataResponce?.data?.data;
    const statusColors = {};
    if (resourceData?.policy?.statusColor) {
      for (const item of resourceData?.policy?.statusColor) {
        if (Array.isArray(item.status)) {
          item.status.forEach((status) => {
            statusColors[status] = item.colorCode;
          });
        } else {
          statusColors[item.status] = item.colorCode;
        }
      }
    }
    const { fieldsDataForRead } = await fetch_resource_view_fields(serializedAsset.resource, permissions?.serializedAsset?.isUpdate);
    let statusFieldOption = fieldsDataForRead?.find((e) => e?.fieldData?.fieldName === 'status')?.fieldData?.option || [];
    statusFieldOption = statusFieldOption?.filter(
      (e) => !SYSTEM_ASSET_STATUS?.includes(e.optionLabel) || [ASSET_STATUS.inRepair]?.includes(e.optionLabel)
    );
    setStatusOptions(statusFieldOption);

    let newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes.serializedAssetDetail.path, true);
    newColumns?.forEach((o) => {
      if (o?.accessor === 'assetNumber') {
        o.cell = ({ row }) => (
          <div
            style={{
              backgroundColor: (() => {
                return statusColors[row?.original?.status]
                  ? statusColors[row?.original?.status]
                  : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(row?.original?.status)
                    ? COLOUR_MASTER.lostAssets.background
                    : '';
              })()
            }}
          >
            <Link
              className="link text-truncate"
              title={row?.original?.assetNumber}
              to={`${routes.serializedAssetDetail.path}/${row?.original?._id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row?.original?.assetNumber}
            </Link>
            {(row?.original?.recertDate && new Date(row?.original?.recertDate)?.getTime() <= new Date()?.getTime()) ||
              (row?.original?.certificateExpiryDate && new Date(row?.original?.certificateExpiryDate)?.getTime() <= new Date()?.getTime() && (
                <Box ml={1}>
                  <HtmlTooltip title="Asset needs to be recert">
                    <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
                  </HtmlTooltip>
                </Box>
              ))}
          </div>
        );
      }
    });
    newColumns.push({
      accessor: 'ownerType',
      Header: 'Actual Owner Type',
      minWidth: 150,
      width: 150,
      Cell: ({ row }) => (
        <>
          {row?.original?.ownerType ? (
            <h5 className="text-truncate" title={row?.original?.ownerType}>
              {row?.original?.ownerType}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    });
    newColumns.push({
      accessor: 'owner',
      Header: 'Actual Owner',
      minWidth: 150,
      width: 150,
      Cell: ({ row }) => (
        <>
          {row?.original?.owner ? (
            <h5 className="text-truncate" title={row?.original?.owner}>
              {row?.original?.owner}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    });
    setColumns([...newColumns, ...getStaticFields()]);
    fetchPolicy();
  };

  const fetchFieldSerializedAssetStatusChangeRequest = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(
      sidebarResource.serializedAssetStatusChangeRequest,
      false
    );
    setSerializedAssetStatusChangeRequestFields([...fieldsDataForRead]);
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAssetsInspection}`);
      if (data) {
        if (data?.policy?.canCreateRepairOrder) {
          setStatusOptions((prev) => {
            let newOptions = prev?.filter((e) => e.optionValue !== ASSET_STATUS.inRepair);
            return newOptions;
          });
        }
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddAssetsToRepairOrder = async (repairOrderData: any) => {
    let rows = selectedRecords?.map((record: any) => ({
      materialId: record._id,
      type: MATERIAL_TYPE.serializedAsset,
      qty: 1,
      parentId: null
    }));
    axiosInstance()
      .post(`${repairOrder.api}/${repairOrderData}/product-package`, { material: rows })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setShowRepairOrderDialog(false);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssetsToRepairJob = async (repairJobData: any) => {
    let rows = selectedRecords?.map((record: any) => ({
      _id: record._id,
      currentStatus: record.status
    }));
    axiosInstance()
      .post(`${repairJob.api}/${repairJobData}/assets`, { assets: rows })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setShowRepairJobDialog(false);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${serializedAsset.api}/serialized-asset-inspection${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    if (selectedWarehouse && selectedWarehouse !== '') {
      deepFilter = `${deepFilter}&warehouse=${selectedWarehouse}`;
    }
    if (subleaseAsset) {
      deepFilter = `${deepFilter}&subleaseAsset=1`;
    } else {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return `${deepFilter}`;
  };

  const handleStatusChange = (status) => {
    if (status === ASSET_STATUS.scrap || status === ASSET_STATUS.lost) {
      setStatus(status);
      setShowReasonDialog(true);
    } else {
      handleStatusUpdate({ status });
    }
  };

  const handleStatusUpdate = (obj) => {
    const ids = selectedRecords?.map((d) => ({
      _id: d._id,
      currentStatus: d.status
    }));
    axiosInstance()
      .put(`${serializedAsset.api}/update-status`, {
        assets: ids,
        status: obj?.status,
        comment: obj?.reason ? obj?.reason : '',
        reference: { _id: '', type: INVENTORY_HISTORY_TYPE.serializedAssets }
      })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const ActionMenuItems = () => {
    return (
      <>
        {statusOptions ? (
          <>
            {Object.entries(statusOptions).map(([key, status]: any) => {
              const isDisabled = selectedRecords.some((record) => record.status === status?.optionLabel);
              return (
                <MenuItem
                  key={key}
                  onClick={() => {
                    if (
                      status?.optionValue === ASSET_STATUS.scrap &&
                      user?.user?.brandPolicy?.serializedAssetScrapApproval &&
                      serializedAssetStatusChangeRequestFields?.length > 0
                    ) {
                      setStatusChangeRequestDialog(true);
                    } else {
                      handleStatusChange(status?.optionLabel);
                    }
                  }}
                  disabled={isDisabled}
                >
                  {status?.optionLabel}
                </MenuItem>
              );
            })}
          </>
        ) : null}
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.serializedAssetInspection, title: 'Serialize Asset Inspection' }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={
            <LeftSideContent
              {...{
                permissions,
                warehouseOptions,
                selectedWarehouse,
                setSelectedWarehouse,
                subleaseAsset,
                setSubleaseAsset,
                resources,
                ActionMenuItems,
                setAnchorEl,
                anchorEl
              }}
            />
          }
          rightSideContents={
            <RightSideContents
              {...{
                openActions,
                anchorEl,
                closeActions,
                ActionMenuItems,
                selectedRecords,
                resourceData,
                permissions,
                setShowRepairOrderDialog,
                setShowRepairJobDialog,
                resources
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.serializedAsset}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
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
      {showRepairOrderDialog && (
        <ManageRepairOrder
          referenceType="serializedAssetsInspection"
          referenceData={{
            warehouse: selectedRecords[0]?.warehouseId
          }}
          onClose={() => setShowRepairOrderDialog(false)}
          onSuccess={(obj) => {
            handleAddAssetsToRepairOrder(obj?._id);
          }}
          isClone={false}
        />
      )}
      {showRepairJobDialog && (
        <ManageRepairJob
          referenceType="serializedAssetsInspection"
          referenceData={{
            warehouse: selectedRecords[0]?.warehouseId
          }}
          onClose={() => setShowRepairJobDialog(false)}
          onSuccess={(obj) => {
            handleAddAssetsToRepairJob(obj?._id);
          }}
          isClone={false}
        />
      )}
      {openStatusChangeRequestDialog && (
        <StatusChangeRequestDialog
          status={ASSET_STATUS.scrap}
          onClose={() => {
            setStatusChangeRequestDialog(false);
          }}
          assetData={selectedRecords?.map((s) => ({ _id: s?._id, assetNumber: s?.assetNumber, status: s?.status }))}
          onSuccess={() => {
            setStatusChangeRequestDialog(false);
            fetchData();
          }}
        />
      )}
    </section>
  );
};

export default SerializedAssetInspection;

const LeftSideContent = ({ permissions, warehouseOptions, selectedWarehouse, setSelectedWarehouse, subleaseAsset, setSubleaseAsset, resources }) => {
  return (
    <>
      <Fragment>
        <Autocomplete
          className={`w-full lg:w-[230px]`}
          options={warehouseOptions}
          getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
          isOptionEqualToValue={(option: any, val) => option.optionValue === val}
          value={
            warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
              ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
              : ''
          }
          onChange={(e, val) => {
            setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="none"
              size="small"
              name="warehouse"
              label={resources?.warehouse?.titleSingular}
              variant="outlined"
              fullWidth
            />
          )}
        />
        {permissions?.sublease && (
          <FormControlLabel
            control={
              <Checkbox
                name="subleaseAsset"
                checked={subleaseAsset}
                onChange={(e) => {
                  setSubleaseAsset(e.target.checked);
                }}
                color="primary"
              />
            }
            style={{ color: 'var(--dark-primary-text, var(--primary))', marginLeft: '-11px' }}
            label={`Subleased ${resources?.serializedAsset?.titlePlural}`}
          />
        )}
      </Fragment>
    </>
  );
};

const RightSideContents = ({
  openActions,
  anchorEl,
  closeActions,
  ActionMenuItems,
  selectedRecords,
  resourceData,
  permissions,
  setShowRepairOrderDialog,
  setShowRepairJobDialog,
  resources
}) => {
  const checkUniqWarehouse = () => {
    let warehouses = new Set(selectedRecords?.map((d) => d?.warehouseId));
    return warehouses?.size === 1;
  };

  return (
    <>
      {resourceData?.policy?.canCreateRepairOrder && permissions?.repairOrder?.isCreate && (
        <ThemeButton
          buttonType="themeBorder"
          onClick={() => setShowRepairOrderDialog(true)}
          disabled={
            checkUniqWarehouse() &&
            selectedRecords?.every((e) =>
              [
                ASSET_STATUS.new,
                ASSET_STATUS.available,
                ASSET_STATUS.scrap,
                ASSET_STATUS.needRecert,
                ASSET_STATUS.needRepair,
                ASSET_STATUS.underReview
              ]?.includes(e.status)
            )
              ? false
              : true
          }
        >
          {`Create ${resources?.repairOrder?.titleSingular}`}
        </ThemeButton>
      )}
      {resourceData?.policy?.canCreateRepairOrder && permissions?.repairJob?.isCreate && (
        <ThemeButton
          buttonType="themeBorder"
          onClick={() => setShowRepairJobDialog(true)}
          disabled={
            checkUniqWarehouse() &&
            selectedRecords?.every((e) =>
              [ASSET_STATUS.scrap, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair, ASSET_STATUS.underReview]?.includes(e.status)
            )
              ? false
              : true
          }
        >
          {`Create ${resources?.repairJob?.titleSingular}`}
        </ThemeButton>
      )}
      <ThemeButton
        onClick={openActions}
        endIcon={<ExpandMore />}
        buttonType="yellow"
        disabled={selectedRecords?.length ? false : true}
        mobileTooltip="Change Status"
        iconForMobile={<RiExchange2Line size={24} />}
      >
        Change Status
      </ThemeButton>
      <Menu
        anchorEl={anchorEl}
        id="action-menu"
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        open={Boolean(anchorEl)}
        onClose={closeActions}
      >
        <span onClick={() => closeActions()}>{ActionMenuItems && <ActionMenuItems />}</span>
      </Menu>
    </>
  );
};
