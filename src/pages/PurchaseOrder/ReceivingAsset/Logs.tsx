import { useState, useEffect } from 'react';
import { Dialog } from '@material-ui/core';
import { CustomDialogTransition, dateTimeFormat } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { capitalize } from 'lodash';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { useAppTheme } from 'src/constants/AppConfig';
import moment from 'moment';

const Logs = ({ handleClose, detail, inventoryHistory }) => {
  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';
  const [columns, setColumns] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'date',
        Header: 'Date',
        width: 200,
        disableFilters: true,
        disableSortBy: true,
        disabled: true,
        Cell: ({ row }) => {
          return row.original?.date ? <p className="text-truncate">{moment(row?.original?.date)?.format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 200,
        disabled: true,
        Cell: ({ row }) => {
          return row.original?.type ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 200,
        disabled: true,
        Cell: ({ row }) => {
          return row.original?.qty ? (
            <div
              style={{
                backgroundColor:
                  row?.original?.type === 'Debit'
                    ? isDarkTheme
                      ? 'hsl(1 100% 65% / 1)'
                      : '#FFCCCB'
                    : isDarkTheme
                      ? 'hsl(120 73% 40% / 1)'
                      : '#90ee90'
              }}
            >
              {row?.original?.type === 'Debit' ? `-${row?.original?.qty}` : row?.original?.qty}
            </div>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'supplierPartNumber',
        Header: 'Supplier Part Number',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.supplierPartNumber ? <p className="text-truncate">{row.original.supplierPartNumber}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'comment',
        Header: 'Comment',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.comment ? <p className="text-truncate">{row.original.comment}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'transactionDate',
        Header: 'Actual Transaction Date',
        width: 200,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => {
          return row.original?.transactionDate ? (
            <p className="text-truncate">{moment(row?.original?.transactionDate)?.format(dateTimeFormat)}</p>
          ) : (
            <NoDataCell />
          );
        }
      }
    ];
    setColumns(columns);
  };
  useEffect(() => {
    const data = JSON.parse(JSON.stringify(inventoryHistory));
    let rows = data?.map((u: any, index) => {
      u._id = index;
      u.type = capitalize(u?.type);
      return u;
    });
    rows?.reverse();
    dispatch({ type: 'initialize', data: rows, count: rows.length });
  }, []);

  return (
    <Dialog fullWidth fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={`Logs - ${detail}`} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent isFooterPresent={false}>
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={'purchaseOrder_logs'}
          isClientSideGrid={true}
          refreshGrid={() => {}}
          hideAction={true}
          hideSelection={true}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default Logs;
