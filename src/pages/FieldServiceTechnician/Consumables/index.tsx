import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import ConsumablesQtyDialog from './ConsumablesQtyDialog';

const Consumables = ({ selectedFieldService, recall }) => {
  let renderedFrom = camelCase(routes?.workOrder.title + 'workOrder_consumables');

  const toastConfig = useContext(CustomToastContext);

  const [dataRows, setDataRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false);

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [selectedFieldService]);

  const fetchColumns = () => {
    const column: any = [
      {
        accessor: 'product',
        Header: 'Product',
        width: 300,
        Cell: ({ row }) =>
          row?.original?.product ? (
            <p className="text-truncate" title={row?.original?.product}>
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original.product}`} target="_blank">
                {row.original.productName}
              </a>
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: false,
        width: 150,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      {
        accessor: 'consumedQty',
        Header: 'Consumed Qty',
        width: 150,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
      }
      // {
      //   accessor: 'action',
      //   Header: 'Action',
      //   width: 50,
      //   sticky: 'right',
      //   disableFilters: true,
      //   canDrag: false,
      //   Cell: ({ row }: any) => (
      //     <div style={{ display: 'flex', justifyContent: 'center' }}>
      //       <HtmlTooltip title="Delete">
      //         <IconButton
      //           size="small"
      //           aria-label="Delete"
      //           disabled={row?.original?.consumedQty ? true : false}
      //           onClick={() => {
      //             handleDelete([row.original]);
      //           }}
      //         >
      //           <DeleteIcon color={row?.original?.consumedQty ? 'disabled' : 'error'} />
      //         </IconButton>
      //       </HtmlTooltip>
      //     </div>
      //   )
      // }
    ];
    setColumns(column);
  };

  const fetchData = () => {
    setDataRows(null);
    console.log(selectedFieldService?.technicianAssign?.material);
    const consumableData = selectedFieldService?.technicianAssign?.material?.map((u) => {
      let res: any = {
        ...u,
        productName: u?.productDetail?.productName
      };
      return res;
    });

    setDataRows(consumableData || []);
  };

  // const handleSubmit = async (rows) => {
  //   // const data: any = [];
  //   // rows?.forEach((e) => {
  //   //   if (parseInt(e.qty)) {
  //   //     data.push({ product: e._id, qty: parseInt(e.qty), service, uniqueId, stepId });
  //   //   }
  //   // });
  //   // axiosInstance()
  //   //   .post(`${workOrder.api}/${workOrderId}/consumable`, data)
  //   //   .then(({ data }) => {
  //   //     fetchData();
  //   //     setConsumablesDialog(false);
  //   //     toastConfig.setToastConfig({
  //   //       open: true,
  //   //       type: 'success',
  //   //       message: data.message
  //   //     });
  //   //   })
  //   //   .catch((error) => {
  //   //     toastConfig.setToastConfig(error);
  //   //   });
  // };

  // const handleDelete = async (rows) => {
  //   // const ids = rows.map((e) => e._id);
  //   // axiosInstance()
  //   //   .put(`${workOrder.api}/${workOrderId}/consumable/remove`, {
  //   //     ids: ids || []
  //   //   })
  //   //   .then(({ data }) => {
  //   //     fetchData();
  //   //     toastConfig.setToastConfig({
  //   //       open: true,
  //   //       type: 'success',
  //   //       message: data.message
  //   //     });
  //   //   })
  //   //   .catch((error) => {
  //   //     toastConfig.setToastConfig(error);
  //   //   });
  // };

  // const onSaveInlineEdit = async (inputField, updatedData) => {
  //   // if (parseInt(inputField.qty) < updatedData.consumedQty) {
  //   //   toastConfig.setToastConfig({
  //   //     open: true,
  //   //     type: 'error',
  //   //     message: 'Qty can not be less than consumed qty'
  //   //   });
  //   //   return;
  //   // } else if (parseInt(inputField.qty) === 0) {
  //   //   toastConfig.setToastConfig({
  //   //     open: true,
  //   //     type: 'error',
  //   //     message: 'Qty can not be 0'
  //   //   });
  //   //   return;
  //   // }
  //   // inputField.qty = parseInt(inputField.qty);
  //   // axiosInstance()
  //   //   .put(`${workOrder.api}/${workOrderId}/consumable/update-qty`, [
  //   //     {
  //   //       product: updatedData?.productId,
  //   //       ...inputField,
  //   //       _id: updatedData._id
  //   //     }
  //   //   ])
  //   //   .then(({ data }) => {
  //   //     fetchData();
  //   //     toastConfig.setToastConfig({
  //   //       open: true,
  //   //       type: 'success',
  //   //       message: data.message
  //   //     });
  //   //   })
  //   //   .catch((error) => {
  //   //     toastConfig.setToastConfig(error);
  //   //   });
  // };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" p={2} pt={0}>
        {/* <Box display="flex" flexWrap={'wrap'}>
          <Button variant={'contained'} color="primary" size="small" onClick={() => setConsumablesDialog(true)}>
            Add Products/Consumables
          </Button>
        </Box> */}
        <Box display="flex" ml={1}>
          <Button
            disabled={selectedRecords?.filter((e) => !e?.hideSelection).length === 0}
            onClick={() => setOpenConsumablesQtyDialog(true)}
            color="primary"
            size="small"
            variant="contained"
          >
            {'Consume '}{' '}
            {selectedRecords?.filter((e) => !e?.hideSelection).length > 0 ? '(' + selectedRecords?.filter((e) => !e?.hideSelection).length + ')' : ''}
          </Button>
        </Box>
      </Box>

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
        {openConsumablesQtyDialog && (
          <ConsumablesQtyDialog
            selectedFieldService={selectedFieldService}
            onClose={() => setOpenConsumablesQtyDialog(false)}
            onSuccess={() => {
              recall();
              fetchData();
              setOpenConsumablesQtyDialog(false);
            }}
            selectedRecords={selectedRecords?.filter((e) => !e?.hideSelection)}
          />
        )}
      </Grid>
    </>
  );
};

export default Consumables;
