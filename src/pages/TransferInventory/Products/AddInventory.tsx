import { Box, Dialog, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import {
  CustomDialogTransition,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  productInventory,
  sidebarResource
} from 'src/constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';

const AddInventory = ({ warehouse, storageLocation, close, isAdding, submit, renderedFrom, ignoreIds }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, dataRows, limit, selectedRecords, search, filters, sorting, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchFields = async () => {
    const productResult = await axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`);
    const data = productResult?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.productDetail.path);
    newColumns.unshift(
      {
        accessor: 'qty',
        Header: 'Quantity',
        show: true,
        Cell: ({ row }) => <div>{row.original.qty}</div>,
        editable: true,
        disableFilters: true,
        disableSortBy: true,
        canDrag: false
      },
      {
        accessor: 'inventory',
        Header: 'Inventory',
        show: true,
        Cell: ({ row }) => <div>{row.original.inventory}</div>,
        editable: false,
        disableFilters: true,
        disableSortBy: true,
        canDrag: false
      }
    );
    setColumns([...newColumns, ...getStaticFields()]);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${productInventory.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          const selectedData = selectedRecords.find((d: any) => d._id === u._id);
          let finalObject = prepareDataForGrid(u);
          finalObject['_id'] = u._id;
          finalObject['inventory'] = u?.inventory ? u?.inventory - (u?.softHold || 0) : 0;
          finalObject['qty'] = selectedData ? selectedData.qty : finalObject['inventory'] ? 1 : 0;
          finalObject['hideSelection'] = finalObject['inventory'] && finalObject['inventory'] <= 0 ? true : false;
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

  const getQueryString = () => {
    let deepFilter = `?warehouse=${warehouse}&page=${page}&limit=${limit}`;

    if (storageLocation) {
      deepFilter = deepFilter + `&storageLocation=${storageLocation}`;
    }

    if (ignoreIds?.length) {
      deepFilter = deepFilter + `&ignoreIds=${JSON.stringify(ignoreIds)}`;
    }

    const { deepFilters } = gridFilterParser(filters);

    if (!user?.user?.brandPolicy?.showSerializedProduct) {
      deepFilters.push({ field: 'serializedProduct', term: 'No' });
    }

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords?.filter((e) => !e?.hideSelection)?.map((m) => m._id))}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return `${deepFilter}&filterType=and`;
  };

  const handleClickSave = () => {
    const _data = selectedRecords
      ?.filter((e) => !e?.hideSelection)
      ?.map((d) => ({
        product: d._id,
        qty: Number(d.qty)
      }));
    submit(_data);
  };

  const onCellValueChanged = (data, row) => {
    if (!data || !data?.qty) return;
    if (Number(data.qty) > Number(row.inventory)) {
      toastConfig.setToastConfig({
        type: 'warning',
        message: "Qty can't be greater then inventory",
        open: true
      });
      return;
    }
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

  let disableSave =
    selectedRecords?.filter((e) => !e?.hideSelection)?.length === 0 ||
    selectedRecords?.filter((d: any) => Number(d.qty) === 0 && !d?.hideSelection).length > 0 ||
    selectedRecords?.filter((d: any) => Number(d.qty) > Number(d.inventory) && !d?.hideSelection).length > 0 ||
    isAdding;

  const leftSideContents = () => {
    return (
      <>
        {selectedRecords?.filter((d: any) => d.qty === 0 && !d?.hideSelection).length > 0 && (
          <Typography variant="body2" color="error">
            Enter quantity before you save
          </Typography>
        )}
        {selectedRecords?.filter((d: any) => Number(d.qty) > Number(d.inventory) && !d?.hideSelection).length > 0 && (
          <Typography variant="body2" color="error">
            Quantity should be less then inventory
          </Typography>
        )}
      </>
    );
  };

  return (
    <Dialog open TransitionComponent={CustomDialogTransition} fullScreen fullWidth onClose={close}>
      <CustomDialogHeader title="Add Product" onClose={close} showRequiredLabel={false} />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          leftSideContents={leftSideContents()}
          addButtonOnclick={handleClickSave}
          isAddButtonVisible
          addButtonProps={{
            disabled: disableSave,
            loading: isAdding,
            iconsEnabled: false,
            text: selectedRecords?.filter((e) => !e?.hideSelection).length > 0 ? `(${selectedRecords?.filter((e) => !e?.hideSelection).length})` : ''
          }}
          setQueryString={false}
          showSearchInMobile={true}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            onSaveEdit={onCellValueChanged}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddInventory;
