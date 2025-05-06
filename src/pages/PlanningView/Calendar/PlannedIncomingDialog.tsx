import { Box, Dialog, IconButton } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
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

const PlannedIncomingDialog = ({ handleClose, product, resourceList }) => {
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
      Header: 'Resource Label',
      minWidth: 200,
      width: 200,
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <p> {row.original.resourceLabel}</p>
          <IconButton
            size="small"
            onClick={() => {
              const resource = resourceList?.find((r) => r.resource === row.original?.resource);
              window.open(`${resource.path}/${row.original?.referenceId}`);
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      )
    },
    {
      accessor: 'resource',
      Header: 'Resource',
      width: 200,
      Cell: ({ row }) => {
        return row.original['resource'] ? <p className="text-truncate">{row.original.resource}</p> : <NoDataCell />;
      }
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
      width: 200,
      Cell: ({ row }) => {
        return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'serializedProduct',
      Header: 'Serialized Product',
      width: 200,
      Cell: ({ row }) => <p className="text-truncate">{row?.original?.serializedProduct ? 'Yes' : 'No'}</p>,
      accessorFn: (original) => {
        return original?.serializedProduct ? 'Yes' : 'No';
      }
    },
    {
      accessor: 'date',
      Header: 'Date',
      disableFilters: true,
      disabled: true,
      disableSortBy: true,
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

  useEffect(() => {
    fetchData();
  }, [product]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes?.planningView.path}/back-date?product=${product?.optionValue}`)
      .then(({ data: { data } }) => {
        setData(data);
      })
      .catch((error) => {
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

    axiosInstance()
      .get(`${routes?.planningView.path}/back-date/export?product=${product?.optionValue}`, {
        responseType: 'arraybuffer'
      })
      .then((response) => {
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
    <Dialog fullWidth maxWidth="md" open={true} onClose={handleClose} fullScreen={true} aria-labelledby="assign-dialog">
      <CustomDialogHeader onClose={handleClose} title={`${product?.optionLabel}`} showRequiredLabel={false} />
      <CustomDialogContent>
        <div className="p-2">
          <div className="mt-1">
            <Box>
              <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                <CustomTab value={0} label={'Planned'} />
                <CustomTab value={1} label={'Incoming'} />
              </CustomTabs>
            </Box>
            <div className="mt-1">
              <div className="flex items-center justify-end">
                <label onClick={exportToExcel} className={`new-headerbox-button-v1 small}`}>
                  <span>Export to Excel </span>
                  <ExportIcon />
                </label>
              </div>
              <CustomReactTable
                height={'calc(100vh - 300px)'}
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
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default PlannedIncomingDialog;
