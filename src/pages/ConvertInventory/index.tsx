import { Box, IconButton, MenuItem, TextField } from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import { Autocomplete } from '@mui/material';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { convertInventory, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import InventoryToAsset from './InventoryToAsset';
import axios, { CancelTokenSource } from 'axios';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ConvertInventory = () => {
  const renderedFrom = camelCase(sidebarResource?.inventoryToAsset);

  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [warehouseId, setWarehouseId] = useState(null);
  const [storageLocationId, setStorageLocationId] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const [columns, setColumns] = useState(null);
  const [inventory, setInventory] = useState({ open: false, product: [] });

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const { generateColumns } = useColumns();

  useEffect(() => {
    getWarehouse();
  }, [selectedEntity]);

  const getWarehouse = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse},${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.warehouse]) {
          setWarehouseOptions(data[sidebarResource.warehouse]);
          if (warehouseId === null && data[sidebarResource.warehouse].length) {
            setWarehouseId(data[sidebarResource.warehouse][0].optionValue);
          }
        }
        if (data[sidebarResource.storageLocation]) {
          setStorageLocationOptions(data[sidebarResource.storageLocation]);
        }
      });
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (warehouseId) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchProductInventory(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    }
  }, [search, warehouseId, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, storageLocationId]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Product&view=true`);
    data = response?.data?.data;
    let columns = [];
    let newColumns = generateColumns(renderedFrom, data, routes.productDetail.path);
    columns = [...columns, ...newColumns];
    columns.push({
      accessor: 'availableInventory',
      Header: 'Available Inventory',
      width: 120,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => <p className="text-truncate">{row.original.availableInventory}</p>
    });
    columns.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          {permissions?.inventoryToAsset?.isUpdate && (
            <Fragment>
              <Box pl={1}>
                <HtmlTooltip title="Convert Inventory">
                  <IconButton
                    size="small"
                    aria-label="Clone"
                    disabled={row?.original?.availableInventory ? false : true}
                    onClick={() => {
                      setInventory({ open: true, product: [row?.original] });
                    }}
                  >
                    <CachedIcon fontSize="small" color="primary" />
                  </IconButton>
                </HtmlTooltip>
              </Box>
            </Fragment>
          )}
        </>
      )
    });
    setColumns(columns);
  };

  const fetchProductInventory = (cancelTokenSource?: CancelTokenSource) => {
    if (!warehouseId) {
      dispatch({ type: 'initialize', data: [], count: 0 });
      return;
    }
    dispatch({ type: 'loading', loading: true });
    if (warehouseId) {
      const queryString = getQueryString();
      axiosInstance()
        .get(`${convertInventory.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data }) => {
          let rows = data.data?.map((u) => {
            let finalObject = prepareDataForGrid(u, user);
            finalObject['productId'] = u._id;
            finalObject['warehouseId'] = warehouseId;
            finalObject['availableInventory'] = (u?.inventory || 0) - (u?.softHold || 0);
            return {
              ...finalObject
            };
          });
          dispatch({ type: 'initialize', data: rows, count: data.count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          dispatch({ type: 'loading', loading: false });
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getQueryString = () => {
    let deepFilter = `?warehouse=${warehouseId}&page=${page}&limit=${limit}`;
    if (storageLocationId) {
      deepFilter = `${deepFilter}&storageLocation=${storageLocationId}`;
    }

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

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setInventory({
              open: true,
              product: selectedRecords
            });
          }}
        >
          Convert
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <div>
          <CustomBreadCrumbs routes={[{ ...routes.inventoryToAsset, title: resources?.inventoryToAsset?.titlePlural }]} />
        </div>
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={
            <LeftSideContents
              {...{
                warehouseOptions,
                warehouseId,
                setWarehouseId,
                setStorageLocationId,
                user,
                storageLocationOptions,
                storageLocationId,
                dispatch,
                resources
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          isAddButtonVisible={false}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProductInventory}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {inventory.open && (
          <InventoryToAsset
            handleClose={() => setInventory({ open: false, product: [] })}
            handleSuccess={() => {
              dispatch({ type: 'selection', selectedRecords: [] });
              fetchProductInventory();
              setInventory({ open: false, product: [] });
            }}
            product={inventory.product}
            warehouse={warehouseId}
            storageLocation={storageLocationId}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default ConvertInventory;

const LeftSideContents = ({
  warehouseOptions,
  warehouseId,
  setWarehouseId,
  setStorageLocationId,
  user,
  storageLocationOptions,
  storageLocationId,
  dispatch,
  resources
}) => {
  return (
    <>
      <Autocomplete
        style={{ minWidth: '200px', flexGrow: 1 }}
        className="md:max-w-[250px]"
        options={warehouseOptions}
        getOptionLabel={(option: any) => option.optionLabel}
        disableClearable
        getOptionSelected={(option: any, val) => option.optionValue === val}
        value={
          warehouseOptions.filter((data) => data.optionValue === warehouseId).length
            ? warehouseOptions.filter((data) => data.optionValue === warehouseId)[0]
            : ''
        }
        onChange={(e, val) => {
          if (val !== null) {
            dispatch({ type: 'selection', selectedRecords: [] });
            setWarehouseId(val && val.optionValue ? val.optionValue : '');
            setStorageLocationId(null);
          }
        }}
        renderInput={(params) => (
          <TextField {...params} margin="none" size="small" name="plant" label={resources?.warehouse?.titleSingular} variant="outlined" fullWidth />
        )}
      />
      {user?.user?.brandPolicy?.storageLocation && (
        <Autocomplete
          style={{ minWidth: '200px', flexGrow: 1 }}
          className="md:max-w-[250px]"
          options={storageLocationOptions.filter((item) => item.warehouse === warehouseId)}
          getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          value={
            storageLocationOptions.filter((data) => data.optionValue === storageLocationId).length
              ? storageLocationOptions.filter((data) => data.optionValue === storageLocationId)[0]
              : ''
          }
          onChange={(e, val) => {
            setStorageLocationId(val?.optionValue);
          }}
          renderInput={(params) => (
            <TextField {...params} margin="none" size="small" name="storageLocation" label="Storage Location" variant="outlined" fullWidth />
          )}
        />
      )}
    </>
  );
};
