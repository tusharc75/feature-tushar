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
import { isMobile } from 'react-device-detect';

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
        sticky: isMobile ? 'none' : 'left',
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
        accessor: 'productDescription',
        Header: 'Description',
        width: 300,
        Cell: ({ row }) =>
          row.original.productDetail?.productDescription ? (
            <p className="text-truncate">{row.original.productDetail?.productDescription}</p>
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

  return (
    <>
      <Box display="flex" justifyContent="flex-end" p={2} pt={0}>
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
