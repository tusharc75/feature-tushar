import { Box, IconButton, Typography } from '@mui/material';
import { startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import SyncIcon from '@mui/icons-material/Sync';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { MATERIAL_TYPE } from 'src/constants/helpers';

const WorkOrder = ({ disassemblyOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const [columns, setColumns] = useState(null);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  useEffect(() => {
    setNextStep(false);
    checkAllWorkOrderComplete();
    fetchData();
  }, []);

  const autoCreateWorkOrder = async () => {
    try {
      setIsAutoCreating(true);
      await axiosInstance().post(`${routes.disassemblyOrder.path}/work-order/${disassemblyOrderData?._id}`);
      setIsAutoCreating(false);
      fetchData();
    } catch (error) {
      setIsAutoCreating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const checkAllWorkOrderComplete = async () => {
    const response = await axiosInstance().get(
      `${routes.disassemblyOrder.path}/work-order/${disassemblyOrderData?._id}/check-all-work-order-complete`
    );
    if (!!response?.data?.data?.isCompletedAll) {
      setNextStep(true);
    }
    if (response?.data?.data?.materialCount) {
      autoCreateWorkOrder();
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 200,
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.packagesDetail.path}/${row.original._id}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <h5 className="text-truncate">{row.original.description}</h5> : <NoDataCell />;
        }
      },
      {
        accessor: 'workOrder',
        Header: 'Work Order',
        width: 200,
        Cell: ({ row }) =>
          row.original.workOrder ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row.original?.workOrder}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes?.workOrderDetail?.path}/${row.original?.workOrderId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['status'] ? <h5 className="text-truncate">{row.original.status}</h5> : <NoDataCell />;
        }
      }
    ];
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    setNextStep(false);

    const {
      data: { data }
    } = await axiosInstance().get(`${routes.disassemblyOrder.path}/work-order/${disassemblyOrderData?._id}`);

    const rows = data?.map((d, i) => ({
      index: i + 1,
      _id: d?._id,
      detail: d?.packageName,
      description: d?.packageDescription,
      canDelete: true,
      type: MATERIAL_TYPE.package,
      workOrder: d?.workOrder?.workOrderNumber,
      workOrderId: d?.workOrder?._id,
      status: d?.workOrder?.status
    }));

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  return (
    <>
      {isAutoCreating && (
        <Box p={1} display="flex" alignItems="center">
          <SyncIcon className="rotate" /> <Typography variant="subtitle2">Work order Auto Creation in Progress </Typography>
        </Box>
      )}
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default WorkOrder;
