import { Box, Button, Typography } from '@material-ui/core';
import axios, { CancelTokenSource } from 'axios';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { ACCORDION_TYPE, CollapsibleWrapper } from 'src/pages/ScheduleAndDispatch/Scheduler/helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AddServices = ({ setSelectedServices, selectedAssets, isExpand, resources, handleOpen, submitLoad, selectedWarehouse }) => {
  const renderedFrom = `${sidebarResource?.scheduleAndDispatch}_${sidebarResource.serviceMaster}`;
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
  }, [page, limit, filters, sorting]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const handleAdd = () => {
    setSelectedServices(selectedRecords);
    handleOpen(ACCORDION_TYPE.technician);
  };

  useEffect(() => {
    if (submitLoad  || selectedWarehouse) {
      setSelectedServices([]);
      dispatch({ type: 'selection', selectedRecords: [] });
    }
  }, [submitLoad, selectedWarehouse]);

  const fetchGridColumns = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serviceMaster}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes?.serviceMasterDetail?.path, true);

        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.serviceMaster?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
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
    <CollapsibleWrapper
      index={2}
      title={resources?.serviceMaster?.titlePlural}
      isExpand={isExpand}
      accordionType={ACCORDION_TYPE.service}
      handleOpen={handleOpen}
    >
      {columns ? (
        selectedAssets?.length ? (
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={sidebarResource.serviceMaster}
          />
        ) : null
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outlined" color="secondary" size="small" onClick={() => handleOpen(ACCORDION_TYPE.asset)}>
          Back
        </Button>
        <Button disabled={false} variant="contained" size="small" color="primary" onClick={() => handleAdd()}>
          Save & Next
        </Button>
      </div>
    </CollapsibleWrapper>
  );
};

export default AddServices;
