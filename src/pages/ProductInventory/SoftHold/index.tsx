import { Box, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { camelCase, map, uniq } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, prepareDataForGrid, productInventory, sidebarResource } from '../../../constants/helpers';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { FiExternalLink } from 'react-icons/fi';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const renderedFrom = 'softHold';

const SoftHoldDialog = ({ close, data, warehouse }) => {
  const [tabs, setTabs] = useState([]);
  const [value, setValue] = useState(0);
  const [softHoldData, setSoftHoldData] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const {
    state: { resources, user }
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
      accessor: 'reference',
      Header: 'Reference Number',
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row.original?.reference ? (
            <div>
              <p className="text-truncate" title={row?.original?.reference}>
                {row.original?.reference}
              </p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${row.original.path}/${row?.original?.referenceId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'qty',
      Header: 'Quantity',
      disabled: true,
      Cell: ({ row }) => <>{row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />}</>
    },
    {
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row.original?.warehouse ? (
            <div>
              <p className="text-truncate" title={row?.original?.warehouse}>
                {row.original?.warehouse}
              </p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes?.warehouseDetail.path}/${row?.original?.warehouseId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    ...(user?.user?.brandPolicy?.storageLocation
      ? [
        {
          accessor: 'storageLocation',
          Header: resources?.storageLocation?.titleSingular,
          disabled: true,
          Cell: ({ row }) => (
            <>
              {row?.original?.storageLocation ? (
                <div>
                  <p className="text-truncate" title={row?.original?.storageLocation}>
                    {row.original?.storageLocation}
                  </p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes?.storageLocationDetail.path}/${row?.original?.storageLocationId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        }
      ]
      : [])
  ];

  const softHoldDataFetch = () => {
    axiosInstance()
      .get(`${productInventory.api}/soft-hold/${data.productId}?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        var unique = uniq(map(data, 'referenceType'));
        setTabs(unique);
        const result = [];
        data?.forEach((e) => {
          let finalObject: any = prepareDataForGrid(e);
          result.push({
            path: e.referenceType === sidebarResource.transferInventory
              ? routes.transferInventoryDetail.path
              : e.referenceType === sidebarResource.rentalManagement
                ? routes.rentalManagementDetail.path
                : '',
            ...finalObject,
          });
        });
        setSoftHoldData(result);
        const rows = result?.filter((e) => e.referenceType === unique[value]) || [];
        dispatch({ type: 'initialize', data: rows, count: rows.length });
      });
  };

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`Soft Hold History - ${data?.productName}`} onClose={close} showRequiredLabel={false}></CustomDialogHeader>
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
