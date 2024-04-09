import { Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import moment from 'moment';
import { useContext, useEffect } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { dateTimeFormat, gridLoadingTimeout, prepareDataForGrid, sidebarResource, workOrder } from 'src/constants/helpers';

let searchTimeout;

const WorkOrderPlanning = () => {
  const renderedFrom = camelCase(routes?.workOrderPlanning.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const columns = [
    {
      accessor: 'createDate',
      Header: 'Create Date',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        row.original?.createDate ? <p className="text-truncate">{moment(row?.original?.createDate)?.format(dateTimeFormat)}</p> : <NoDataCell />
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => {
        return row.original?.status ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'completedDate',
      Header: 'Completed Date',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        row.original?.completedDate ? <p className="text-truncate">{moment(row?.original?.completedDate)?.format(dateTimeFormat)}</p> : <NoDataCell />
    },
    {
      accessor: 'asset',
      Header: 'Asset',
      Cell: ({ row }) => {
        return row.original?.asset ? (
          <div>
            <a className="link text-truncate" href={`${routes.serializedAssetDetail.path}/${row.original?.assetId}`} target="_blank">
              {row.original?.asset}
            </a>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'service',
      Header: 'Service',
      Cell: ({ row }) => {
        return row.original?.service ? (
          <div>
            <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original?.serviceId}`} target="_blank">
              {row.original?.service}
            </a>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    }
  ];

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, search, sorting, selectedEntity, showFilteredRecordsOnly]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${workOrder.api}/work-order-planning${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.workOrderPlanning]} />
      </div>
      <CustomContainer>
        <ListingPageHeader searchValue={search} onSearch={handleSearch} isActionButtonVisible={false} isAddButtonVisible={false} />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={() => {}}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={false}
            resource={sidebarResource.workOrderPlanning}
            hideAction={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </section>
  );
};

export default WorkOrderPlanning;
