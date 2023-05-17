import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, Typography } from '@material-ui/core';
import moment from 'moment';
import { MATERIAL_REQUEST_STATUS, dateTimeFormat } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { camelCase } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const Request = ({ workOrder }) => {

  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState([]);


  const {
    state: { user }
  }: any = useData();


  useEffect(() => {
    fetchColumn()
    fetchData();
  }, [workOrder]);

  const handleUpdateStatus = (status, ids) => {
    setLoading(true)
    axiosInstance()
      .put(`/material-handling/status/${workOrder}`, { status, ids })
      .then(({ data }) => {
        setLoading(false)
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData()
      })
      .catch((err) => {
        setLoading(false)
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = () => {
    axiosInstance().get(`/material-handling/request/${workOrder}`)
      .then(({ data: { data } }) => {
        data?.forEach((e) => {
          e.productName = e.product?.optionLabel
          e.productDescription = e.product?.productDescription
          e.productNumber = e.product?.productNumber
          e.requestBy = e.requestBy?.optionLabel
          e.responseBy = e.responseBy?.optionLabel
          e.storageLocation = e.storageLocation?.optionLabel
        })
        setRowsData(data)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

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
            return row.original[e?.fieldName] ?
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.product?.optionValue}`} target="_blank">
                {row.original[e?.fieldName]}
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
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
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
          return row.original['qty'] ? <p className="text-truncate">{row.original['qty']}</p> : <NoDataCell />;
        }
      },
      ...(user?.user?.brandPolicy?.storageLocation ? [
        {
          accessor: 'storageLocation',
          Header: 'Storage Location',
          width: 200,
          hide: false,
          Cell: ({ row }) => {
            return row.original['storageLocation'] ? <p className="text-truncate">{row.original['storageLocation']}</p> : <NoDataCell />;
          }
        }
      ] : []),
      {
        accessor: 'requestBy',
        Header: 'Request By',
        width: 200,
        Cell: ({ row }) => {
          return row.original['requestBy'] ? <p className="text-truncate">{row.original['requestBy']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'requestDate',
        Header: 'Request Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['requestDate'] ? <p className="text-truncate">{moment(row.original['requestDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'responseBy',
        Header: 'Response By ',
        width: 200,
        Cell: ({ row }) => {
          return row.original['responseBy'] ? <p className="text-truncate">{row.original['responseBy']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'responseDate',
        Header: 'Response Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['responseDate'] ? <p className="text-truncate">{moment(row.original['responseDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      }
    ];
    extracolumns.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 250,
      width: 250,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return row.original['status'] === MATERIAL_REQUEST_STATUS.requested ?
          <Box display='flex'>
            <Button
              variant="outlined"
              className={'btn-outline-v1'}
              size="small"
              disabled={loading}
              onClick={() => {
                handleUpdateStatus(MATERIAL_REQUEST_STATUS.processed, [{ _id: row.original?._id, uniqueId: row.original?.uniqueId, qty: row.original?.qty }]);
              }}
            >
              Process
            </Button>
            <Box pl={2} />
            <Button
              variant="outlined"
              className={'btn-outline-red-v1'}
              size="small"
              disabled={loading}
              onClick={() => {
                handleUpdateStatus(MATERIAL_REQUEST_STATUS.rejected, [{ _id: row.original?._id, uniqueId: row.original?.uniqueId, qty: row.original?.qty }]);
              }}
            >
              Reject
            </Button>
          </Box>
          :
          <Typography variant='body2'>{row.original?.status}</Typography>
      }
    });
    setColumns([...column, ...extracolumns]);
  };

  return (rowsData && columns ?
    <Box p={2}>
      <Box zIndex={5} width={'100%'} height={'calc(100vh - 260px)'}>
        <CustomReactTable
          height={'calc(100vh - 260px)'}
          columns={columns}
          data={rowsData}
          onSelect={() => {
          }}
          childrenProperty="subRows"
          uniqueKey="_id"
          hideSelection={true}
          hideAction={false}
          hideExpander={true}
          renderedFrom={camelCase(routes.materialHandling.title)}
          isClientSideGrid={true}
        />
      </Box>
    </Box> :
    <Box p={2} height={500} bgcolor="white">
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>
  );
};

export default Request;
