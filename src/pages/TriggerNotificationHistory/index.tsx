import { useContext, useEffect, useState } from 'react';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { getStaticFields, gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import { Box } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { Link } from 'react-router-dom';

const TriggerNotificationHistory = () => {
  const renderedFrom = camelCase(routes?.triggerNotificationHistory.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, filters, sorting } = state;

  const {
    state: { user }
  }: any = useData();

  let columns = [
    {
      accessor: 'reference',
      Header: 'Reference',
      width: 180,
      show: true,
      disabled: false,
      Cell: ({ row }) =>
        row?.original?.reference ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              className="link text-truncate"
              title={camelCase(row?.original?.referenceType)}
              to={`${routes[camelCase(row?.original?.referenceType)].path}/detail/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>{' '}
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'referenceType',
      Header: 'Reference Type',
      width: 180,
      show: true,
      disabled: false,
      Cell: ({ row }) => (row?.original?.referenceType ? <div>{row?.original?.referenceType}</div> : <NoDataCell />)
    },
    {
      accessor: 'notificationUsers',
      Header: 'Notified Users',
      width: 180,
      show: true,
      disabled: false,
      Cell: ({ row }) => (row?.original?.notificationUsers ? <div>{row?.original?.notificationUsers}</div> : <NoDataCell />)
    },
    {
      accessor: 'message',
      Header: 'Message',
      width: 180,
      show: true,
      disabled: false,
      Cell: ({ row }) => (row?.original?.message ? <div>{row?.original?.message}</div> : <NoDataCell />)
    },
    ...getStaticFields()
  ];
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [page, limit, filters, sorting]);


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
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.triggerNotificationHistory?.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u, index) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject.index = index + 1;
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

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.triggerNotificationHistory]} />
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
