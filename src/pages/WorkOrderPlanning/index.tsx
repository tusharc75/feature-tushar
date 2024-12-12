import { Box, MenuItem, TextField } from '@material-ui/core';
import { camelCase, map, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  INVENTORY_OWNER_TYPE,
  REPAIR_ORDER_TYPE,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  workOrder
} from 'src/constants/helpers';
import ManageRepairOrder from '../RepairOrder/ManageRepairOrder';
import { Autocomplete } from '@material-ui/lab';
import { Link } from 'react-router-dom';
import moment from 'moment';
import axios, { CancelTokenSource } from 'axios';

const renderedFrom = camelCase(sidebarResource?.workOrderPlanning);
const WorkOrderPlanning = () => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity,resources }
  }: any = useData();

  const statusOption = ['Pending', 'In-Progress', 'Completed'];

  const [columns, setColumns] = useState(null);
  const [openRepairOrderDialog, setOpenRepairOrderDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');

  const fetchColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.workOrderPlanning}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, null, true);
    newColumns?.forEach((o) => {
      if (o?.accessor === 'asset') {
        const getBackgroundColor = (row) => {
          const today = moment();
          const dueDate = moment(row?.original?.dueDate);
          const days = dueDate.diff(today, 'days');
          let color = '';
          if (row?.original?.status === 'Pending') {
            if (days <= 1) {
              color = COLOUR_MASTER.lostAssets.background;
            } else if (days <= 7) {
              color = COLOUR_MASTER.replaceAssetColor.background;
            }
          }
          return color;
        };
        o.cell = ({ row }) => (
          <div style={{ backgroundColor: getBackgroundColor(row) }}>
            <Link
              className="link text-truncate"
              title={row?.original?.asset}
              target="_blank"
              to={`${routes.serializedAssetDetail.path}/${row?.original?.assetId}`}
            >
              {row?.original?.asset}
            </Link>
          </div>
        );
      }
    });

    setColumns([...newColumns]);
  };

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, search, sorting, selectedEntity, showFilteredRecordsOnly, selectedStatus]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedStatus) {
      deepFilters.push({ field: 'status', term: selectedStatus });
    }

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
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${workOrder.api}/work-order-planning${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data.map((u) => {
            let finalObject = prepareDataForGrid(u, user);
            finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
            finalObject['asset'] = u?.asset?.assetNumber;
            finalObject['assetId'] = u?.asset?._id;
            finalObject['warehouse'] = u?.asset?.warehouse;
            finalObject['warehouseId'] = u?.asset?.warehouseId;
            finalObject['assetStatus'] = u?.asset?.status;
            finalObject['currentOwnerType'] = u?.asset?.currentOwnerType;
            finalObject['ownerType'] = u?.asset?.ownerType;
            return finalObject;
          });
          dispatch({ type: 'initialize', data: rows, count: count });
        }
      )
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleAddAssets = async (repairOrder) => {
    axiosInstance()
      .post(`${workOrder.api}/work-order-planning/material`, {
        repairOrderId: repairOrder?._id,
        _ids: selectedRecords?.map((e) => e?._id)
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const LeftSideContent = () => {
    return (
      <Autocomplete
        options={statusOption}
        style={{ minWidth: '300px' }}
        value={selectedStatus}
        getOptionLabel={(option) => option || ''}
        getOptionSelected={(option: any, val: any) => option === val}
        onChange={(_, newVal) => {
          setSelectedStatus(newVal ? newVal : 'Pending');
        }}
        renderInput={(params) => <TextField {...params} margin="dense" label="Status" name="status" variant="outlined" />}
      />
    );
  };

  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={
            selectedRecords.some((r) => r?.repairOrderId) ||
            selectedRecords?.some(
              (r) =>
                ![
                  ASSET_STATUS.new,
                  ASSET_STATUS.available,
                  ASSET_STATUS.scrap,
                  ASSET_STATUS.underReview,
                  ASSET_STATUS.needRepair,
                  ASSET_STATUS.needRecert,
                  ASSET_STATUS.customerPossession
                ].includes(r?.assetStatus)
            ) ||
            selectedRecords.some((r) => r?.currentOwnerType != INVENTORY_OWNER_TYPE.brand) ||
            !checkUniqWarehouse()
          }
          onClick={() => {
            setOpenRepairOrderDialog(true);
          }}
        >
          {`Create ${resources?.repairOrder?.titleSingular}`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{...routes.workOrderPlanning,title:resources?.workOrderPlanning?.titlePlural}]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isAddButtonVisible={false}
          leftSideContents={<LeftSideContent />}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
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
            resource={sidebarResource.workOrderPlanning}
            hideAction={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {openRepairOrderDialog && (
          <ManageRepairOrder
            onClose={() => {
              setOpenRepairOrderDialog(false);
            }}
            onSuccess={(data) => {
              handleAddAssets(data);
              setOpenRepairOrderDialog(false);
            }}
            referenceType={sidebarResource.workOrderPlanning}
            referenceData={{ warehouse: selectedRecords[0]?.warehouseId, type: REPAIR_ORDER_TYPE.internal }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default WorkOrderPlanning;
