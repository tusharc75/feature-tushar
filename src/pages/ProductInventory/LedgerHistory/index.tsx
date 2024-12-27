import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import { displayDateTime, gridLoadingTimeout, prepareDataForGrid, productInventory, sidebarResource } from 'src/constants/helpers';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Dialog from '@mui/material/Dialog';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase, capitalize } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { useAppTheme } from 'src/constants/AppConfig';

const LedgerHistory = ({ handleClose, product, productName, referenceId, uniqueId }) => {
  const renderedFrom = `${camelCase(sidebarResource?.productInventory)}_history`;

  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'date',
        Header: 'Date',
        width: 200,
        disabled: true,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => {
          return row.original?.date ? <p className="text-truncate">{displayDateTime(row?.original?.date)}</p> : <NoDataCell />;
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
        type: 'number',
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
        accessor: 'price',
        Header: 'Cost',
        type: 'number',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.price ? <p className="text-truncate">{row.original.price}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'totalPrice',
        Header: 'Amount',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.totalPrice ? (
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
              {row?.original?.type === 'Debit' ? `-${row?.original?.totalPrice}` : row?.original?.totalPrice}{' '}
            </div>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'warehouse',
        Header: resources?.warehouse?.titleSingular,
        width: 200,
        disabled: true,
        Cell: ({ row }) => {
          return row.original?.warehouse ? (
            <Link className="link text-truncate" title={row.original?.warehouse} to={`${routes.warehouseDetail.path}/${row.original?.warehouseId}`}>
              {row.original?.warehouse}
            </Link>
          ) : (
            <NoDataCell />
          );
        }
      },
      ...(user?.user?.brandPolicy?.storageLocation
        ? [
            {
              accessor: 'storageLocation',
              Header: 'Storage Location',
              width: 200,
              Cell: ({ row }) => {
                return row?.original?.storageLocation ? (
                  <Link
                    className="link"
                    title={row?.original?.storageLocation}
                    to={`${routes?.storageLocationDetail?.path}/${row?.original?.storageLocationId}`}
                  >
                    {row?.original?.storageLocation}
                  </Link>
                ) : (
                  <NoDataCell />
                );
              }
            }
          ]
        : []),
      {
        accessor: 'supplierPartNumber',
        Header: 'Supplier Part Number',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.supplierPartNumber ? <p className="text-truncate">{row.original.supplierPartNumber}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'serialNumber',
        Header: 'Serial Number',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (
          <div>
            {row?.original?.serialNumber ? (
              <h5 className="text-truncate" title={row?.original?.serialNumber}>
                {row?.original?.serialNumber}
              </h5>
            ) : (
              <NoDataCell />
            )}
          </div>
        )
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
        accessor: 'user',
        Header: 'Transacted By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.user ? (
            <Link className="link text-truncate" title={row?.original?.user} to={`${routes.userDetail.path}/${row?.original?.userId}`}>
              {row?.original?.user}
            </Link>
          ) : (
            <NoDataCell />
          );
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
            <p className="text-truncate">{displayDateTime(row?.original?.transactionDate)}</p>
          ) : (
            <NoDataCell />
          );
        }
      }
    ];
    setColumns(columns);
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${productInventory.api}/ledger/${referenceId}/${uniqueId}/${product}`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject.type = capitalize(u.type);
          finalObject.serialNumber = u?.serialNumber?.map((e) => e.serialNumber)?.toString();
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <>
      <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
        <CustomDialogHeader title={`History - ${productName}`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent isFooterPresent={false}>
          <Grid size={{xs:12, md:12, sm:12}} className="mt-3">
            {columns ? (
              <CustomReactTable
                height={'calc(100vh - 150px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                refreshGrid={fetchRecords}
                hideAction={true}
                hideSelection={true}
              />
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default LedgerHistory;
