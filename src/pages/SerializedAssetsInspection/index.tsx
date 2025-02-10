import { Box, Chip, MenuItem, TextField } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import WarningIcon from '@mui/icons-material/Warning';
import queryString from 'query-string';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase, isArray, isObject } from 'lodash';
import { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
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
  SYSTEM_ASSET_STATUS,
  gridLoadingTimeout,
  prepareDataForGrid,
  serializedAsset,
  serializedAssetInspection,
  sidebarResource
} from '../../constants/helpers';
import axios, { CancelTokenSource } from 'axios';
import ReasonDialog from '../SerializedAsset/ReasonDialog';

const renderedFrom = camelCase(sidebarResource?.serializedAsset);

const SerializedAssetInspection = () => {
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  let {
    assetStatus,
    warehouse,
    currentLocation,
    jobCount
  }: any = queryString.parse(history.location.search);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [subleaseAsset, setSubleaseAsset] = useState(false);

  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetch = async () => {
      await fetchGridColumns();
    };
    fetch();
  }, [permissions, selectedEntity]);

  useEffect(() => {
    if (columns) {
      if (assetStatus || warehouse || currentLocation || jobCount) {
        const filterVal = {};
        if (assetStatus) {
          filterVal['status'] = { filter: [assetStatus] };
        }
        if (warehouse) {
          const warehouseFilter = JSON.parse(warehouse);
          if (isArray(warehouseFilter)) {
            filterVal['warehouse'] = {
              operator: 'OR',
              condition1: {
                filter: warehouseFilter
              }
            };
          }
        }
        if (currentLocation) {
          const currentLocationFilter = JSON.parse(currentLocation);
          if (isArray(currentLocationFilter)) {
            filterVal['currentLocation'] = {
              operator: 'OR',
              condition1: {
                filter: currentLocationFilter
              }
            };
          }
        }
        if (jobCount) {
          if (isObject(JSON.parse(jobCount))) {
            filterVal['jobCount'] = { filter: ((JSON.parse(jobCount))?.optionValue)?.toString() };
          }
        }
        dispatch({ type: 'filter', filters: filterVal });
      }
    }
  }, [columns]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    limit,
    filters,
    sorting,
    selectedWarehouse,
    selectedEntity,
    subleaseAsset,
    showFilteredRecordsOnly
  ]);


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

    axiosInstance()
      .get(`/field?resource=${serializedAssetInspection.resource}`)
      .then(({ data: { data } }) => {
        data?.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setAllowUpdateStatus(o?.isUpdate);
            return true;
          }
        });
        let newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path, true);
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
                {row?.original?.currentLocationNotMatchWithGps && (
                  <Box ml={1}>
                    <HtmlTooltip title="Asset location needs to be update in Equipt">
                      <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
                    </HtmlTooltip>
                  </Box>
                )}
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
      });
  };


  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${serializedAssetInspection.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
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

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedWarehouse && selectedWarehouse !== '') {
      filterByIds.push({ field: 'warehouse', term: selectedWarehouse });
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
    if (subleaseAsset) {
      deepFilter = `${deepFilter}&subleaseAsset=1`;
    } else {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return `${deepFilter}&filterType=and`;
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
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const ActionMenuItems = () => {
    if (!permissions?.serializedAsset?.isUpdate || !allowUpdateStatus || !selectedRecords?.length) {
      return null;
    }
    return (
      <>
        {Object.entries(ASSET_STATUS).map(([key, label]) => {
        if (SYSTEM_ASSET_STATUS.includes(label) && label !== ASSET_STATUS.repair && label !== ASSET_STATUS.inRepair) {
          return null;
        }
        
        const isDisabled = selectedRecords?.some((record) => record.status === label);

        return (
          <MenuItem key={key} onClick={() => handleStatusChange(label)} disabled={isDisabled}>
            {`Status Change - ${label}`}
          </MenuItem>
        );
      })}
      </>
    );
  };
  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.serializedAssetInspection, title: "Serialize Asset Inspection" }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={<LeftSideContent
            {...{
              permissions,
              warehouseOptions,
              selectedWarehouse,
              setSelectedWarehouse,
              subleaseAsset,
              setSubleaseAsset,
              resources
            }} />}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />} isAddButtonVisible={false} />

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
    </section>
  );
};

export default SerializedAssetInspection;

const LeftSideContent = ({
  permissions,
  warehouseOptions,
  selectedWarehouse,
  setSelectedWarehouse,
  subleaseAsset,
  setSubleaseAsset,
  resources
}) => {
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
            <TextField {...params} margin="none" size="small" name="plant" label={resources?.warehouse?.titleSingular} variant="outlined" fullWidth />
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
