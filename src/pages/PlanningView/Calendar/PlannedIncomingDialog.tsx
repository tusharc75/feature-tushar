import { Box, Dialog, IconButton } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { displayDateTime, downloadExcel, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import { ExportIcon } from 'src/assets/svg/svgIcons';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Grid from '@mui/material/Grid2';

const PlannedIncomingDialog = ({ handleClose, products, warehouses, resourceList }) => {

  const renderedFrom = `${camelCase(sidebarResource?.planningView)}_planned/Incomming`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState(null);

  const {
    state: { resources }
  }: any = useData();

  const columns = [
    {
      accessor: 'resourceLabel',
      Header: 'Resource',
      Cell: ({ row }) => {
        return row.original['resourceLabel'] ? <p className="text-truncate">{row.original.resourceLabel}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'resourceLabel',
      Header: 'Reference',
      disabled: true,
      Cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <p> {row.original.resourceLabel}</p>
          <IconButton
            size="small"
            onClick={() => {
              const resource = resourceList?.find((r) => r.resource === row.original?.resource);
              if (resource) {
                window.open(`${resource.path}/${row.original?.referenceId}`);
              }
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      )
    },
    {
      accessor: 'customerAccount',
      Header: resources?.customerAccount?.titleSingular,
      Cell: ({ row }) => (
        <>
          {row?.original?.customerAccount ? (
            <div className="flex items-center gap-1">
              <p className="text-truncate"> {row.original.customerAccount}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.customerAccountDetail.path}/${row.original.customerAccountId}`);
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
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
      Cell: ({ row }) => (
        <>
          {row?.original?.warehouse ? (
            <div className="flex items-center gap-1">
              <p className="text-truncate"> {row.original.warehouse}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.warehouseDetail.path}/${row.original.warehouseId}`);
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
      Header: 'Qty',
      Cell: ({ row }) => {
        return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'date',
      Header: 'Date',
      Cell: ({ row }) => (
        <div>
          {row?.original?.date ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.date)}>
              {displayDateTime(row?.original?.date)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    }
  ];

  const getQueryString = () => {
    let query = `?product=${products?.map((e) => e?.optionValue)?.toString()}`
    if (warehouses && warehouses?.length) {
      query += `&warehouse=${warehouses?.map((e) => e?.optionValue)?.toString()}`
    }
    return query;
  }

  useEffect(() => {
    fetchData();
  }, [products]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance().get(`${routes?.planningView.path}/back-date${getQueryString()}`).then(({ data: { data } }) => {
      setData(data);
    }).catch((error) => {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    });
  };

  useEffect(() => {
    if (data) {
      dispatch({ type: 'loading', loading: false });
      let rows = tabValue === 0 ? data['palnning'] : tabValue === 1 ? data['incoming'] : [];
      rows = rows.map((u) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject.resourceLabel = resources?.[camelCase(u?.resource)]?.titleSingular || u?.resource;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    }
  }, [tabValue, data]);

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
  };

  const exportToExcel = () => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Loading, Please wait...`
    });

    axiosInstance().get(`${routes?.planningView.path}/back-date/export${getQueryString()}`, {
      responseType: 'arraybuffer'
    }).then((response) => {
      const fileName = response.headers['content-disposition'].split('filename=')[1];
      downloadExcel(response.data, fileName);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Exported to excel successfully.'
      });
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={true}
      onClose={handleClose}
      fullScreen={true}
      aria-labelledby="assign-dialog">
      <CustomDialogHeader onClose={handleClose} title={`${products?.map((e) => e?.optionLabel)?.toString()}`} showRequiredLabel={false} />
      <CustomDialogContent>
        <div className="p-2">
          <div className="mt-1">
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                    <CustomTab value={0} label={'Pending Planned'} />
                    <CustomTab value={1} label={'Pending Incoming'} />
                  </CustomTabs>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <div className="flex items-center justify-end">
                    <label onClick={exportToExcel} className={`new-headerbox-button-v1 small}`}>
                      <span>Export to Excel </span>
                      <ExportIcon />
                    </label>
                  </div>
                </Grid>
              </Grid>
            </Box>
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideSelection={true}
              isClientSideGrid={true}
            />
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default PlannedIncomingDialog;
