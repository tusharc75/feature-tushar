import { useContext, useEffect, useState } from 'react';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { Box } from '@mui/material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { displayDateTime, gridLoadingTimeout, sidebarResource } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { Link } from 'react-router-dom';
import axios, { CancelTokenSource } from 'axios';
import { useData } from 'src/StateProvider/Provider';

const TriggerNotificationHistory = () => {
  const renderedFrom = camelCase(sidebarResource?.triggerNotificationHistory);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting } = state;

  const {
    state: { resources }
  }: any = useData();

  let columns = [
    {
      accessor: 'createdBy',
      Header: 'Date',
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) =>
        row?.original?.createdBy?.date ? <div>{displayDateTime(row?.original?.createdBy?.date)}</div> : <NoDataCell />
    },
    {
      accessor: 'reference',
      Header: 'Reference',
      width: 180,
      disabled: true,
      Cell: ({ row }) =>
        row?.original?.reference ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              target="_blank"
              className="link text-truncate"
              title={row?.original?.reference?.optionLabel}
              to={`${routes[camelCase(row?.original?.referenceType)].path}/detail/${row?.original?.reference?.optionValue}`}
            >
              {row?.original?.reference?.optionLabel}
            </Link>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'referenceType',
      Header: 'Reference Type',
      width: 180,
      disabled: true,
      Cell: ({ row }) => (row?.original?.referenceType ? <div>{row?.original?.referenceType}</div> : <NoDataCell />)
    },
    {
      accessor: 'message',
      Header: 'Message',
      width: 180,
      disabled: true,
      Cell: ({ row }) => (row?.original?.message ? <div>{row?.original?.message}</div> : <NoDataCell />)
    },
    {
      accessor: 'notificationUsers',
      Header: 'Notified Users',
      width: 180,
      disabled: true,
      Cell: ({ row }) => (
        <div>
          {row?.original['notificationUsers'] && row?.original['notificationUsers']?.length ? (
            row?.original['notificationUsers']?.map((e, i) => {
              return i === row?.original['notificationUsers'].length - 1 ? (
                <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                  {e?.optionLabel}
                </a>
              ) : (
                <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                  {e?.optionLabel},{' '}
                </a>
              );
            })
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    }
  ];
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [page, limit, filters, sorting]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
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
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes?.triggerNotificationHistory?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        dispatch({ type: 'initialize', data: data, count: count });
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

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.triggerNotificationHistory, title: resources?.triggerNotificationHistory?.titlePlural }]} />
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
            hideSelection={true}
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

export default TriggerNotificationHistory;
