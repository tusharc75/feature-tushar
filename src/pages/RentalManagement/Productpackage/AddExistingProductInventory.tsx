import { Box, Dialog } from '@material-ui/core';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';

const AddExistingProductInventory = ({ rentalManagementData, isSubmitting, handleClose, addMaterial }) => {
  const renderedFrom = `${camelCase(routes.product?.title)}`;

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);

  const defaultColumns = [
    {
      accessor: 'qty',
      Header: 'Qty',
      minWidth: 150,
      width: 150,
      editable: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
    },
    {
      accessor: 'availableAssetCount',
      Header: 'Available Asset',
      minWidth: 180,
      width: 180,
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.availableAssetCount || <NoDataCell />}</h5>
    }
  ];

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        let columns = [];
        let newColumns = generateColumns(renderedFrom, data, routes.productDetail.path);
        columns = [...newColumns, ...getStaticFields()];
        setColumns([...defaultColumns, ...columns]);
      });
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchMaterial(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const getQueryString = () => {
    let deepFilter = `?warehouse=${rentalManagementData?.warehouse?.optionValue}&page=${page}&limit=${limit}`;

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    const updatedDeepFilters = [...deepFilters];
    const updatedFilterByIds = [...filterByIds];

    if (updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(updatedFilterByIds)}`;
    }
    if (updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedDeepFilters))}`;
    }
    if (updatedFilterByIds?.length || updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchMaterial = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/rental-management/product-with-inventory${queryString}`, {
        cancelToken: cancelTokenSource?.token
      })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['qty'] = 1;
          const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
          if (qtyAdded.length) {
            finalObject['qty'] = qtyAdded[0].qty;
          }
          finalObject['productCategory'] = u.productCategory?.optionLabel;
          finalObject['priceTemplate'] = u.priceTemplate?.optionLabel;
          finalObject['unitMain'] = u.unit;
          finalObject['pricingMethodMain'] = u.pricingMethod;
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const rows = [...dataRows];
    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
        d.isChecked = true;
      }
    });
    if (!selectedRecords?.find((e) => e._id === row?._id)) {
      const editRow = rows?.find((e) => e._id === row?._id);
      if (editRow) {
        dispatch({ type: 'selection', selectedRecords: [...selectedRecords, editRow] });
      }
    } else {
      const updatedSelectedRecords = selectedRecords?.map((e) => {
        if (e?._id === row?._id) {
          return { ...e, qty: parseInt(data?.qty), isChecked: true };
        }
        return e;
      });
      dispatch({ type: 'selection', selectedRecords: updatedSelectedRecords });
    }
    dispatch({ type: 'update', data: rows });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <>
        <CustomDialogHeader title={`Add ${routes.product.title}`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
        <div className="listing-grid p-3">
          <ListingPageHeader
            showSearchInMobile={true}
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            addButtonProps={{
              disabled: !selectedRecords?.length || isSubmitting,
              loading: isSubmitting,
              iconsEnabled: false,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
            }}
            addButtonOnclick={() => {
              addMaterial(selectedRecords);
            }}
            isAddButtonVisible={true}
            setQueryString={false}
          />
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={'renderedFrom'}
              onSaveEdit={onSaveEdit}
              refreshGrid={fetchMaterial}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.product}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </>
    </Dialog>
  );
};

export default AddExistingProductInventory;
