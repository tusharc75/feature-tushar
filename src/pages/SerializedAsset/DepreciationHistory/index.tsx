import { useState, useEffect, useContext, useReducer } from 'react';
import { Box } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { displayDate, prepareDataForGrid, serializedAsset, sidebarResource } from '../../../constants/helpers';
import { camelCase } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';

const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_depreciationHistory`;

const DepreciationHistory = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    var api = `${serializedAsset.api}/${id}/depreciation-history`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchGridColumns = () => {
    const column = [
      {
        accessor: 'date',
        Header: 'Date',
        disableFilters: true,
        disableSortBy: false,
        disabled: true,
        Cell: ({ row }) => (row.original?.date ? <div>{displayDate(row.original?.date)}</div> : <NoDataCell />)
      },
      {
        accessor: 'amount',
        Header: 'Depreciation Amount',
        disabled: true,
        Cell: ({ row }) => (row.original?.amount ? <div>{row.original?.amount}</div> : <NoDataCell />)
      },
      {
        accessor: 'netBookValue',
        Header: 'Net Book Value',
        disabled: true,
        Cell: ({ row }) => (row.original?.netBookValue ? <div>{row.original?.netBookValue}</div> : <NoDataCell />)
      }
    ];
    setColumns([...column]);
  };

  return (
    <>
      <Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            showFilters={false}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </>
  );
};

export default DepreciationHistory;
