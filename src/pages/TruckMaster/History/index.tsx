import { useState, useEffect, useContext, Fragment } from 'react';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import axiosInstance from 'src/axios/axiosInstance';
import { Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import moment from 'moment';
import { dateTimeFormat } from 'src/constants/helpers';

const renderedFrom = `${camelCase(routes?.truckMaster.title)}_History`;

const History = ({ id, status }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const columns = [
    {
      accessor: 'reference',
      Header: 'Reference',
      primaryField: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.reference ? (
            <p
              className="link text-truncate"
              title={row?.original?.reference?.optionLabel}
              onClick={() => window.open(`${routes.truckMasterDetail.path}/${row?.original?.reference?.optionValue}`)}
            >
              {row?.original?.reference?.optionLabel}
            </p>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'referenceType',
      Header: 'Type',
      Cell: ({ row }) => (
        <>
          {row?.original?.referenceType ? (
            <h5 className="text-truncate" title={row?.original?.referenceType}>
              {row?.original?.referenceType}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'date',
      Header: 'Date & Time',
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.date ? (
            <h5 className="text-truncate" title={moment(row?.original?.date)?.format(dateTimeFormat)}>
              {moment(row?.original?.date)?.format(dateTimeFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (
        <>
          {row?.original?.status ? (
            <h5 className="text-truncate" title={row?.original?.status}>
              {row?.original?.status}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'comments',
      Header: 'Comment',
      Cell: ({ row }) => (
        <>
          {row?.original?.comments ? (
            <h5 className="text-truncate" title={row?.original?.comments}>
              {row?.original?.comments}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, status]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes.truckMaster?.path}/history/${id}`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Fragment>
      <Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default History;
