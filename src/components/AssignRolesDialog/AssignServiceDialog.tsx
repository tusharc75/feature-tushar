import { Box, Dialog } from '@material-ui/core';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, serviceMaster, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomTabs, { CustomTab } from '../CustomTabs';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { findOne, objectStore } from 'src/constants/indexdbhelper';

const AssignServiceDialog = ({
  onSuccess,
  handleClose,
  ids = [],
  extraStaticFilter = [],
  isSubmitting = false,
  hideQty = false,
  extraFilterById = null,
  pricingCondition = null
}) => {
  const renderedFrom = `${camelCase(routes.serviceMaster?.title)}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
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
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, tabValue]);

  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.serviceMaster);
      } else {
        const response = await axiosInstance().get('/field?resource=Service Master&view=true');
        data = response?.data?.data;
      }
      let columns = [];
      let newColumns = generateColumns(renderedFrom, data, routes.serviceMasterDetail.path);
      columns = [...newColumns, ...getStaticFields()];
      if (hideQty) {
        setColumns([...columns]);
      } else {
        setColumns([...defaultColumns, ...columns]);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    try {
      dispatch({ type: 'loading', loading: true });
      let data, count;
      if (isOffline) {
        data = await findOne(objectStore.resourceData, sidebarResource.serviceMaster);
        data = data?.filter((d: any) => !ids?.includes(d?._id?.toString()));
        count = data?.length;
      } else {
        const queryString = getQueryString();
        const response = await axiosInstance().get(`${serviceMaster.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
        data = response?.data?.data;
        count = response?.data?.count;
      }
      let rows = data?.map((u) => {
        let finalObject = prepareDataForGrid(u);
        finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
        finalObject['qty'] = 1;
        finalObject['unitMain'] = u?.unit;
        finalObject['pricingMethodMain'] = u?.pricingMethod;
        const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
        if (qtyAdded.length) {
          finalObject['qty'] = qtyAdded[0].qty;
        }
        return {
          ...finalObject
        };
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      toastConfig.setToastConfig(error);
      dispatch({ type: 'loading', loading: false });
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

    if (extraStaticFilter?.length) {
      extraStaticFilter?.forEach((e) => {
        if (e?.field === 'preWork') {
          if (user?.user?.brandPolicy?.servicePrePost) {
            updatedDeepFilters.push(e);
          }
        } else {
          updatedDeepFilters.push(e);
        }
      });
    }
    if (extraFilterById && extraFilterById?.length) {
      extraFilterById?.forEach((e) => {
        updatedFilterByIds.push(e);
      });
    }
    if (updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(updatedFilterByIds)}`;
    }
    if (updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedDeepFilters))}`;
    }
    if (updatedDeepFilters?.length || updatedDeepFilters?.length) {
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
      onClose={handleClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={`Assign ${routes.serviceMaster.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          showSearchInMobile={true}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          addButtonProps={{
            disabled: isSubmitting || selectedRecords?.length === 0,
            loading: isSubmitting,
            iconsEnabled: false,
            text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
          }}
          addButtonOnclick={() => {
            onSuccess(selectedRecords);
          }}
          isAddButtonVisible={true}
          setQueryString={false}
        />
        {pricingCondition && !isOffline && (
          <Box>
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
              <CustomTab value={0} label={`${routes.pricingCondition.title} Services`} />
              <CustomTab value={1} className={'tabLayout'} label={'All Services'} />
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
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={!isOffline}
            resource={sidebarResource.serviceMaster}
            isClientSideGrid={isOffline}
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

export default AssignServiceDialog;
