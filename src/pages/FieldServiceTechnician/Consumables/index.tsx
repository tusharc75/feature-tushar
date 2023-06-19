import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton, Typography } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import ConsumablesQtyDialog from './ConsumablesQtyDialog';
import { isMobile } from 'react-device-detect';
import CustomTableWithCard, { CardInterface, createBodyColumns, ColumnInterface } from 'src/components/CustomTableWithCard';

const Consumables = ({ selectedFieldService, recall }) => {
  let renderedFrom = camelCase(routes?.fieldTicket.title + '_consumables');

  const [dataRows, setDataRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false);
  const [accessor, setAccessor] = useState<CardInterface | null>(null);

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [selectedFieldService]);

  const fetchColumns = () => {
    setAccessor(null);
    const column: ColumnInterface[] = [
      {
        field: 'productDescription',
        headerName: 'Description',
        cellRenderer: 'commonRenderer'
      },
      {
        field: 'qty',
        headerName: 'Qty',
        cellRenderer: 'commonRenderer'
      },
      {
        field: 'consumedQty',
        headerName: 'Consumed Qty',
        cellRenderer: 'commonRenderer'
      }
    ];
    const accessor: CardInterface = {
      name: (row) =>
        row?.product ? (
          <Typography className="text-truncate" title={row?.product} component={'h6'}>
            Product :{' '}
            <a className="link text-truncate" href={`${routes.productDetail.path}/${row.product}`} target="_blank">
              {row.productName}
            </a>
          </Typography>
        ) : (
          '---'
        ),
      headerColumns: [],
      bodyColumns: createBodyColumns({ columns: column, exclude: ['product'], xs: 6, sm: 4, md: 4, lg: 2 })
    };
    setAccessor(accessor);
  };

  const fetchData = () => {
    setDataRows(null);
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
      <Box display="flex" justifyContent="flex-end" p={2}>
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
          {accessor && dataRows ? (
            <Box height={'calc(100vh - 290px)'}>
              <CustomTableWithCard
                data={dataRows}
                accessor={accessor}
                uniqueKey={(data) => data._id}
                onSelect={setSelectedRecords}
                checkBox={true}
                height={'calc(100vh - 290px)'}
              />
              {/* <CustomReactTable
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
              /> */}
            </Box>
          ) : (
            <Box p={2} height={500}>
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
