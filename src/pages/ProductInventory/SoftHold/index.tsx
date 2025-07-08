import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { camelCase, map, uniq } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, productInventory, sidebarResource } from '../../../constants/helpers';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';

const renderedFrom = 'softHold';

const SoftHoldDialog = ({ close, data, warehouse }) => {
  const [tabs, setTabs] = useState([]);
  const [value, setValue] = useState(0);
  const [softHoldData, setSoftHoldData] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    if (tabs?.length) {
      const rows = softHoldData?.filter((e) => e.referenceType === tabs[value]) || [];
      dispatch({ type: 'update', data: rows });
    }
  }, [value]);

  useEffect(() => {
    softHoldDataFetch();
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const columns = [
    {
      accessor: 'referenceNumber',
      Header: 'Reference Number',
      width: 120,
      disabled: true,
      Cell: ({ row }) => (
        <div>
          <p
            className="text-truncate link"
            title={row?.original?.referenceNumber}
            onClick={() => window.open(`${row.original.path}/${row?.original?.referenceNumberId}`)}
          >
            {row.original?.referenceNumber}
          </p>
        </div>
      )
    },
    {
      accessor: 'inventory',
      Header: 'Inventory',
      disabled: true,
      width: 120,
      Cell: ({ row }) => <div>{row.original?.inventory}</div>
    },
    {
      accessor: 'product',
      Header: 'Product',
      disabled: true,
      width: 150,
      Cell: ({ row }) => <div>{row.original?.product}</div>
    },
    {
      accessor: 'warehouse',
      Header: 'Warehouse',
      disabled: true,
      width: 120,
      Cell: ({ row }) => <div>{row.original?.warehouse}</div>
    },
    {
      accessor: 'storageLocation',
      Header: 'Storage Location',
      disabled: true,
      width: 140,
      Cell: ({ row }) => <div>{row.original?.storageLocation}</div>
    }
  ];

  const softHoldDataFetch = () => {
    axiosInstance()
      .get(`${productInventory.api}/soft-hold/${data.productId}?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        var unique = uniq(map(data, 'referenceType'));
        setTabs(unique);
        const result = [];
        data?.forEach((e) => {
          result.push({
            path:
              e.referenceType === sidebarResource.transferInventory
                ? routes.transferInventoryDetail.path
                : e.referenceType === sidebarResource.rentalManagement
                  ? routes.rentalManagementDetail.path
                  : '',
            product: e?.productName?.optionLabel,
            warehouse: e?.warehouse?.optionLabel,
            storageLocation: e?.storageLocation?.optionLabel,
            inventory: e?.qty,
            referenceNumber: e?.reference?.optionLabel,
            referenceNumberId: e?.reference?.optionValue,
            referenceType: e?.referenceType
          });
        });
        setSoftHoldData(result);
        const rows = result?.filter((e) => e.referenceType === unique[value]) || [];
        dispatch({ type: 'initialize', data: rows, count: rows.length });
      });
  };

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`Soft Hold History (${data?.productName})`} onClose={close} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        <CustomTabs value={value} onChange={handleChange}>
          {tabs?.map((row, index) => <CustomTab value={index} label={resources?.[camelCase(row)]?.titlePlural || row} />)}
        </CustomTabs>
        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={softHoldDataFetch}
              hideSelection={true}
              isClientSideGrid={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </CustomDialogContent>
    </Dialog>
  );
};

export default SoftHoldDialog;
