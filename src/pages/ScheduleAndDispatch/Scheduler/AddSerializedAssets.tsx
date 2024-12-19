import { Box, Button, Checkbox, FormControlLabel, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import axios, { CancelTokenSource } from 'axios';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ASSET_STATUS, gridLoadingTimeout, prepareDataForGrid, serializedAsset, sidebarResource } from 'src/constants/helpers';
import AssetQtyDialog from './AssetQtyDialog';
import { ACCORDION_TYPE, CollapsibleWrapper } from 'src/pages/ScheduleAndDispatch/Scheduler/helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { FiExternalLink } from 'react-icons/fi';

const AddSerializedAssets = ({
  setSelectedAssets,
  isExpand,
  resources,
  handleOpen,
  setSelectedWarehouse,
  selectedWarehouse,
  setSelectedProduct,
  selectedProduct,
  selectedAssets,
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
  const [isAutoSelectAsset, setIsAutoSelectAsset] = useState(false);
  const [isVirtualizedTableView, setIsVirtualizedTableView] = useState(false);

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
    if (!isVirtualizedTableView) {
      setSelectedAssets(selectedRecords);
    }
    handleOpen(ACCORDION_TYPE.service);
  };

  useEffect(() => {
    if (submitLoad || selectedProduct || selectedWarehouse) {
      setSelectedAssets([]);
      dispatch({ type: 'selection', selectedRecords: [] });
      setIsVirtualizedTableView(false);
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
    deepFilters.push({ field: 'status', term: [ASSET_STATUS.available, ASSET_STATUS.new] });

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
          {selectedProduct && selectedWarehouse && !isVirtualizedTableView && (
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={isAutoSelectAsset}
                  name={`Auto Select Asset`}
                  onChange={(e) => {
                    setIsAutoSelectAsset(e.target.checked);
                  }}
                />
              }
              label={`Auto Select Asset`}
            />
          )}
          {isVirtualizedTableView && (
            <Button
              disabled={false}
              variant="contained"
              size="small"
              color="primary"
              onClick={() => {
                setIsVirtualizedTableView(false);
                setSelectedAssets([]);
              }}
              style={{
                display: 'block',
                alignSelf: 'center'
              }}
            >
              Reset
            </Button>
          )}
        </div>
        {isVirtualizedTableView ? (
          <RenderVirtualizedAssetTable selectedAssets={selectedAssets} />
        ) : columns ? (
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
          <Button
            disabled={!selectedAssets?.length && !selectedRecords?.length}
            variant="contained"
            size="small"
            color="primary"
            onClick={() => handleAdd()}
          >
            Save & Next
          </Button>
        </div>
      </CollapsibleWrapper>

      {isAutoSelectAsset && (
        <AssetQtyDialog
          warehouse={selectedWarehouse}
          product={selectedProduct}
          handleClose={() => setIsAutoSelectAsset(false)}
          handleSuccess={(data) => {
            setSelectedAssets(data);
            setIsVirtualizedTableView(true);
            setIsAutoSelectAsset(false);
          }}
        />
      )}
    </>
  );
};

export default AddSerializedAssets;

const RenderVirtualizedAssetTable = ({ selectedAssets }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const data: { assetNumber: string; _id: string }[] = useMemo(
    () =>
      selectedAssets?.map((s, idx: number) => ({
        assetNumber: s.assetNumber,
        _id: s._id
      })) || [],
    [selectedAssets]
  );

  const rowVirtualizer = useVirtualizer({
    count: data?.length,
    estimateSize: () => 40,
    getScrollElement: () => scrollContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  
  return (
    <div
      style={{
        display: 'block',
        overflow: 'auto',
        height: 'calc(100vh - 393px)',
        marginTop: '10px'
      }}
      ref={scrollContainerRef}
      className="custom-react-table editable-table-v1 w-full border"
    >
      <MaUTable className="w-full border-separate border-spacing-0" size="small">
        <TableHead
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%'
          }}
        >
          <TableRow className="h-[40px] bg-gray-200">
            <TableCell key="no" className="flex items-center border-b border-gray-300 text-left font-bold" style={{ width: '50%' }}>
              S no.
            </TableCell>
            <TableCell key="asset" className="flex items-center border-b border-gray-300 text-left font-bold" style={{ width: '50%' }}>
              Asset
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%'
          }}
        >
          {virtualRows?.map((virtualRow) => {
            const row = data[virtualRow.index];
            return (
              <TableRow
                key={row._id}
                ref={(node) => rowVirtualizer.measureElement(node)}
                style={{
                  position: 'absolute',
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  width: '100%'
                }}
              >
                <TableCell className="flex items-center border-b border-gray-300" style={{ flex: '1 1 20%', maxWidth: '50%' }}>
                  {virtualRow.index + 1}
                </TableCell>
                <TableCell className="flex items-center border-b border-gray-300" style={{ flex: '1 1 80%', maxWidth: '50%' }}>
                  <div className="flex items-center gap-2">
                    <p className="truncate" title={row.assetNumber}>
                      {row.assetNumber}
                    </p>
                    <IconButton size="small" onClick={() => window.open(`${routes.serializedAssetDetail.path}/${row?._id}`)}>
                      <FiExternalLink size={16} className="text-gray-500 dark:text-gray-300" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </MaUTable>
    </div>
  );
};
