import { Box, Dialog } from '@material-ui/core';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, product, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { findOne, objectStore } from 'src/constants/indexdbhelper';

const AssignProductDialog = ({
  onSuccess,
  handleCloseDialog,
  ids = [],
  reference = 'product',
  serialized = null,
  extraDeepFilter = [],
  extraFilterById = [],
  isSubmitting = false,
  hideQty = false,
  pricingCondition = null
}) => {
  const renderedFrom = `${camelCase(routes.product?.title)}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [isProductType, setIsProductType] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { isOffline } = useContext(CustomOfflineContext);

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
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty}</h5>
    }
  ];

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchProduct(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, tabValue]);

  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.product);
      } else {
        const response = await axiosInstance().get('/field?resource=Product&view=true');
        data = response?.data?.data;
      }
      const productTypes = data.find((e) => e.fieldData.fieldName === 'productType');
      if (productTypes) {
        setIsProductType(true);
      } else {
        setIsProductType(false);
      }
      let columns = [];
      let newColumns = generateColumns(renderedFrom, data, routes.productDetail.path);
      columns = [...newColumns, ...getStaticFields()];
      if (hideQty) {
        setColumns([...columns]);
      } else {
        setColumns([...defaultColumns, ...columns]);
      }
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchProduct = async (cancelTokenSource?: CancelTokenSource) => {
    try {
      dispatch({ type: 'loading', loading: true });
      let data, count;
      if (isOffline) {
        data = await findOne(objectStore.resourceData, sidebarResource.product);
        data = data?.filter((d: any) => !ids?.includes(d?._id?.toString()));
        count = data?.length;
      } else {
        const queryString = getQueryString();
        const response = await axiosInstance().get(`${product.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
        data = response?.data?.data;
        count = response?.data?.count;
      }
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u);
        finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
        finalObject['qty'] = 1;
        finalObject['unitMain'] = u?.unit;
        finalObject['pricingMethodMain'] = u?.pricingMethod;
        const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
        if (qtyAdded.length) finalObject['qty'] = qtyAdded[0].qty;
        return { ...finalObject };
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (err) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(err);
    }
  };

  const getQueryString = () => {
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;

    if (pricingCondition && tabValue === 0) {
      deepFilter = `${deepFilter}&pricingCondition=${pricingCondition}`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    const updatedDeepFilters = [...deepFilters];
    const updatedFilterByIds = [...filterByIds];

    if (extraDeepFilter?.length > 0) {
      extraDeepFilter?.map((e) => {
        updatedDeepFilters.push(e);
      });
    }
    if (isProductType) {
      updatedDeepFilters.push({
        field: 'productType',
        term: 'Part'
      });
    }
    if (reference === 'purchaseOrder') {
      if (!user?.user?.brandPolicy?.purchaseOrderShowSerializedProduct) {
        updatedDeepFilters.push({ field: 'serializedProduct', term: 'No' });
      }
    } else {
      if (serialized != null) {
        updatedDeepFilters.push({
          field: 'serializedProduct',
          term: `${serialized === true ? 'Yes' : 'No'}`
        });
      }
    }
    if (extraFilterById && extraFilterById?.length) {
      extraFilterById?.forEach((e) => {
        updatedFilterByIds.push(e);
      });
    }

    if (updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedDeepFilters))}`;
    }
    if (updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(updatedFilterByIds)}`;
    }

    if (updatedDeepFilters?.length || updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const rows = [...dataRows];
    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = data.qty;
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

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    dispatch({ type: 'selection', selectedRecords: [] });
    dispatch({ type: 'pageChange', page: 0 });
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={`Add ${routes.product.title}`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleCloseDialog} />
      <CustomDialogContent isFooterPresent={false}>
        <>
          <ListingPageHeader
            showSearchInMobile={true}
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            addButtonProps={{
              iconsEnabled: false,
              disabled: isSubmitting || selectedRecords?.length === 0,
              loading: isSubmitting,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
            }}
            addButtonOnclick={() => {
              onSuccess(selectedRecords);
            }}
            isAddButtonVisible
            setQueryString={false}
          />

          {pricingCondition && !isOffline && (
            <Box>
              <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                <CustomTab value={0} label={`${routes.pricingCondition.title} Products`} />
                <CustomTab value={1} className={'tabLayout'} label={'All Products'} />
              </CustomTabs>
            </Box>
          )}
          {columns ? (
            <CustomReactTable
              height={pricingCondition ? 'calc(100vh - 310px)' : 'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              onSaveEdit={onSaveEdit}
              refreshGrid={fetchProduct}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={!isOffline}
              resource={sidebarResource.product}
              isClientSideGrid={isOffline}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  );
};

export default React.memo(AssignProductDialog);
