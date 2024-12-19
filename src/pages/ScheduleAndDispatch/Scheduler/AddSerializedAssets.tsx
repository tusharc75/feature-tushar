import { Box, Button, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import axios, { CancelTokenSource } from 'axios';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ASSET_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { ACCORDION_TYPE, CollapsibleWrapper } from 'src/pages/ScheduleAndDispatch/Scheduler/helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const AddSerializedAssets = ({
  setSelectedAssets,
  isExpand,
  resources,
  handleOpen,
  setSelectedWarehouse,
  selectedWarehouse,
  setSelectedProduct,
  selectedProduct,
  warehouseOptions,
  productOptions,
  submitLoad
}) => {
  const renderedFrom = `${sidebarResource?.scheduleAndDispatch}_${sidebarResource.serializedAsset}`;
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters, sorting, selectedProduct, selectedWarehouse]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const handleAdd = () => {
    setSelectedAssets(selectedRecords);
    handleOpen(ACCORDION_TYPE.service);
  };

  useEffect(() => {
    if (submitLoad || selectedProduct || selectedWarehouse) {
      setSelectedAssets([]);
      dispatch({ type: 'selection', selectedRecords: [] });
    }
  }, [selectedProduct, selectedWarehouse, submitLoad]);

  const fetchGridColumns = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedAsset}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes?.serializedAssetDetail?.path, true);

        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.serializedAsset?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
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

    if (selectedWarehouse) {
      filterByIds.push({ field: 'warehouse', term: selectedWarehouse });
    }
    if (selectedProduct) {
      filterByIds.push({ field: 'product', term: selectedProduct });
    }
    deepFilters.push({ field: 'status', term: ASSET_STATUS.available });

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting?.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  return (
    <>
      <CollapsibleWrapper
        index={1}
        title={resources?.serializedAsset?.titlePlural}
        isExpand={isExpand}
        accordionType={ACCORDION_TYPE.asset}
        handleOpen={handleOpen}
      >
        <div className="flex gap-3">
          {warehouseOptions?.length && (
            <Autocomplete
              style={{ minWidth: '200px', flexGrow: 1 }}
              className="md:max-w-[250px]"
              options={warehouseOptions}
              getOptionLabel={(option: any) => option.optionLabel}
              disableClearable
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={warehouseOptions?.find((data) => data.optionValue === selectedWarehouse) ?? ''}
              onChange={(e, val) => {
                if (val !== null) {
                  setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="none"
                  size="small"
                  name="plant"
                  label={resources?.warehouse?.titleSingular}
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          )}
          {productOptions?.length && (
            <Autocomplete
              style={{ minWidth: '200px', flexGrow: 1 }}
              className="md:max-w-[250px]"
              options={productOptions}
              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={productOptions?.find((data) => data.optionValue === selectedProduct) ?? ''}
              onChange={(e, val) => {
                setSelectedProduct(val && val.optionValue ? val.optionValue : '');
              }}
              renderInput={(params) => (
                <TextField {...params} margin="none" size="small" name="products" label="Product" variant="outlined" fullWidth />
              )}
            />
          )}
        </div>

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={sidebarResource.serializedAsset}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        <div className="flex justify-end">
          <Button disabled={!selectedRecords?.length} variant="contained" size="small" color="primary" onClick={() => handleAdd()}>
            Save & Next
          </Button>
        </div>
      </CollapsibleWrapper>
    </>
  );
};

export default AddSerializedAssets;
