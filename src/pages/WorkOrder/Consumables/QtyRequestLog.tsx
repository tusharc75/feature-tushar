import { Box, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateTimeFormat } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';

function QtyRequestLog({ onClose, workOrderId, uniqueId, renderedFrom }) {

  const [fullScreen, setFullScreen] = useState(false);
  const [columns, setColumns] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [rowsData, setRowsData] = useState([]);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, [workOrderId, uniqueId]);

  const fetchColumn = async () => {
    const column = [];
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription']
        }
      ]
    });
    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          hide: false,
          Cell: ({ row }) => {
            return row?.original[e?.fieldName] ?
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.product?.optionValue}`} target="_blank">
                {row?.original[e?.fieldName]}
              </a>
              : <NoDataCell />;
          }
        });
      }
      else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row?.original[e?.fieldName] ? <p className="text-truncate">{row?.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });
    const extracolumns: any = [
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 200,
        hide: false,
        Cell: ({ row }) => {
          return row?.original['qty'] ? <p className="text-truncate">{row?.original['qty']}</p> : <NoDataCell />;
        }
      },
      ...(user?.user?.brandPolicy?.storageLocation ? [
        {
          accessor: 'storageLocation',
          Header: 'Storage Location',
          width: 200,
          hide: false,
          Cell: ({ row }) => {
            return row?.original['storageLocation'] ? <p className="text-truncate">{row?.original['storageLocation']}</p> : <NoDataCell />;
          }
        }
      ] : []),
      {
        accessor: 'requestBy',
        Header: 'Request By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['requestBy'] ? <p className="text-truncate">{row?.original['requestBy']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'requestDate',
        Header: 'Request Date',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['requestDate'] ? <p className="text-truncate">{moment(row?.original['requestDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'responseBy',
        Header: 'Response By ',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['responseBy'] ? <p className="text-truncate">{row?.original['responseBy']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'responseDate',
        Header: 'Response Date',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['responseDate'] ? <p className="text-truncate">{moment(row?.original['responseDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      }
    ];
    extracolumns.push({
      accessor: 'status',
      Header: 'Status',
      minWidth: 200,
      width: 200,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return <Typography variant='body2'>{row?.original?.status}</Typography>
      }
    });
    setColumns([...column, ...extracolumns]);
  };

  const fetchData = () => {
    axiosInstance().get(`/material-handling/request/${workOrderId}`)
      .then(({ data: { data } }) => {
        const filteredData = data?.filter((e) => e.uniqueId === uniqueId);
        filteredData?.forEach((e) => {
          e.productName = e.product?.optionLabel;
          e.productDescription = e.product?.productDescription;
          e.productNumber = e.product?.productNumber;
          e.requestBy = e.requestBy?.optionLabel;
          e.responseBy = e.responseBy?.optionLabel;
          e.storageLocation = e.storageLocation?.optionLabel;
        });
        setRowsData(filteredData)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (<Dialog
    open
    fullScreen={fullScreen}
    maxWidth="md"
    fullWidth
    onClose={(e, reason) => {
      if (reason !== 'backdropClick') {
        onClose();
      }
    }}
  >
    <CustomDialogHeader
      title={'Logs'}
      onClose={onClose}
      isMinimized={!fullScreen}
      onMinimizeMaximize={() => {
        setFullScreen((prevState) => !prevState);
      }}
      showManimizeMaximize={true}
    />
    <CustomDialogContent>
      {rowsData && columns ?
        <Box p={2}>
        <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'}>
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          data={rowsData}
          onSelect={() => {
          }}
          childrenProperty="subRows"
          uniqueKey="_id"
          hideSelection={true}
          hideAction={false}
          hideExpander={true}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
        />
      </Box>
        </Box> :
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}
    </CustomDialogContent>
  </Dialog>
  );
}

export default QtyRequestLog;
