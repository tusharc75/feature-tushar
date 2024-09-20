import { Box } from '@material-ui/core';
import { camelCase, isEmpty } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import NoDataCell from '../../components/Helpers/NoDataCell';
import routes from '../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axios, { CancelTokenSource } from 'axios';

const DOARequest = () => {
  const renderedFrom = camelCase(routes?.DOARequest.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [renderCount, setRenderCount] = useState(0);

  const columns: any = [
    {
      accessor: 'DOAName',
      Header: 'Name',
      show: true,
      disabled: true,
      Cell: ({ row }) => (
        <div>
          <Link
            className="link"
            to={
              row?.original?.quotation && !isEmpty(row?.original?.quotation)
                ? `/doa-request/quotation/${row?.original?._id}`
                : `/doa-request/${row?.original?._id}`
            }
            title={row?.original?.DOAName}
          >
            {row?.original?.DOAName}
          </Link>
        </div>
      )
    },
    {
      accessor: 'QuotedBy',
      Header: 'Quoted By',
      show: true,
      disabled: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.quotedBy ? (
            <Link className="link" to={`/user/detail/${row?.original?.quoteById}`} title={row?.original?.quotedBy}>
              {row?.original?.quotedBy}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'requestedBy',
      Header: 'Requested By',
      show: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.requestedBy ? (
            <Link className="link" to={`/user/detail/${row?.original?.requestedById}`} title={row?.original?.requestedBy}>
              {row?.original?.requestedBy}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      show: true,
      Cell: ({ row }) => (
        <div>
          <p>{row?.original?.status}</p>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/doa-request${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((doa) => ({
          ...doa,
          quotedBy: doa?.QuotedBy?.optionLabel,
          quoteById: doa?.QuotedBy?.optionValue,
          requestedBy: doa?.RequestedBy?.optionLabel,
          requestedById: doa?.RequestedBy?.optionValue
        }));
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

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.DOARequest]} />
      </div>
      <CustomContainer>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={sidebarResource.DOARequest}
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

export default DOARequest;
