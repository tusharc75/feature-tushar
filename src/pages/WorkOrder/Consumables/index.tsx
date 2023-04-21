import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { workOrder } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';

const Consumables = ({ workOrderId, allowedToEdit }) => {
  let renderedFrom = camelCase(routes?.workOrder.title + 'workOrder_consumables');

  const toastConfig = useContext(CustomToastContext);

  const [dataRows, setDataRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
    fetchRecords();
  }, [allowedToEdit]);

  const fetchRecords = async () => {
    const response = await axiosInstance().get(`${workOrder.api}/${workOrderId}/consumable`);
    const data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = finalObject.type === 'Service' ? 'Soft' : 'Hard';
      return finalObject;
    });
    setDataRows(rows);
  };

  const fetchColumns = async () => {
    const column: any = [
      {
        accessor: 'product',
        Header: 'Product',
        width: 300,
        Cell: ({ row }) =>
          row?.original?.product ? (
            <p className="text-truncate" title={row?.original?.product}>
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original.productId}`} target="_blank">
                {row.original.product}
              </a>
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'service',
        Header: 'Service',
        width: 300,
        Cell: ({ row }) =>
          row?.original?.service ? (
            <p className="text-truncate" title={row?.original?.service}>
              <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original.serviceId}`} target="_blank">
                {row.original.service}
              </a>
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'stepName',
        Header: 'Step Name',
        width: 100,
        minWidth: 100,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.stepName || <NoDataCell />}</p>
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: allowedToEdit ? true : false,
        width: 100,
        minWidth: 100,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      {
        accessor: 'consumedQty',
        Header: 'Consumed Qty',
        width: 100,
        minWidth: 100,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
      },

      {
        accessor: 'action',
        Header: 'Action',
        width: 50,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }: any) => (
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            {!row?.original?.consumedQty && (
              <HtmlTooltip style={{ cursor: 'pointer' }} title={!allowedToEdit ? 'Not Allowed to delete' : 'Delete'}>
                <IconButton
                  disabled={!allowedToEdit}
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    handleDelete([row.original]);
                  }}
                >
                  <DeleteIcon color={!allowedToEdit ? 'disabled' : 'error'} />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        )
      }
    ];
    setColumns(column);
  };

  const handleDelete = async (rows) => {
    const ids = rows.map((e) => e._id);

    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/remove`, {
        ids: ids || []
      })
      .then(({ data }) => {
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    if (parseInt(inputField.qty) < updatedData.consumedQty) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be less than consumed qty'
      });
      return;
    } else if (parseInt(inputField.qty) === 0) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be 0'
      });
      return;
    }
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/update-qty`, [
        {
          product: updatedData?.productId,
          ...inputField,
          _id: updatedData._id
        }
      ])
      .then(({ data }) => {
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={12} sm={12}>
        {columns && dataRows ? (
          <CustomReactTable
            height={'calc(100vh - 345px)'}
            columns={columns}
            data={dataRows}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
          />
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default Consumables;
