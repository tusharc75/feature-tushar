import { useState, useEffect } from 'react';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { dateTimeFormat, gridLoadingTimeout } from 'src/constants/helpers';
import { isMobile } from 'react-device-detect';
import moment from 'moment';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Box } from '@mui/material';

const renderedFrom = 'bids';

const BidsPage = ({ bids }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'user',
        Header: 'User',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.user}</p>
      },
      {
        accessor: 'amount',
        Header: 'Amount',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.amount}</p>
      },

      {
        accessor: 'date',
        Header: 'Date',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{moment(row?.original?.date)?.format(dateTimeFormat)}</p>
      }
    ];
    setColumns(columns);
  };

  useEffect(() => {
    dispatch({ type: 'loading', loading: true });
    bids?.forEach((element) => {
      element.user = element?.user?.firstName + ` ` + element?.user?.lastName;
    });
    dispatch({
      type: 'initialize',
      data: bids,
      count: bids?.length
    });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  }, []);

  return (
    <>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={() => {}}
          isClientSideGrid={true}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default BidsPage;
