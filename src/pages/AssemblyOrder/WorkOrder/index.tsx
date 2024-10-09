import { Box, IconButton, MenuItem, Typography } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, MATERIAL_TYPE, WORK_ORDER_STATUS, workOrder } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import SyncIcon from '@material-ui/icons/Sync';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const WorkOrder = ({ renderedFrom, assemblyOrderData, setNextStep, stepFullScreen, allowedToEdit, setCurrentStep }) => {
  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const { generateColumns } = useColumns();

  useEffect(() => {
    setNextStep(false);
    checkAllWorkOrderComplete();
    fetchData();
  }, []);

  const autoCreateWorkOrder = async () => {
    try {
      setIsAutoCreating(true);
      await axiosInstance().post(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}`);
      setIsAutoCreating(false);
      fetchData();
    } catch (error) {
      setIsAutoCreating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const checkAllWorkOrderComplete = async () => {
    const response = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}/check-all-work-order-complete`);
    if (!!response?.data?.data?.isCompletedAll) {
      setNextStep(true);
    }
    if (response?.data?.data?.materialCount) {
      autoCreateWorkOrder();
    }
  };

  useEffect(() => {
    fetchFields();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', false);
    var data = response?.filter((e) => !['detail', 'description']?.includes(e?.fieldName));
    const newColumns = generateColumns(renderedFrom, data, null, false, assemblyOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
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
                  if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
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
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'workOrder',
      Header: 'Work Order',
      width: 200,
      Cell: ({ row }) =>
        row.original.workOrder ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.workOrder?.optionLabel}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.workOrderDetail.path}/${row.original?.workOrder?.optionValue}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    });
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row }) => {
        return (
          <>
            <HtmlTooltip title="Delete">
              <span>
                <IconButton
                  disabled={row?.original?.canDelete ? false : true}
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setDeleteData([row.original]);
                    setShowConfirmBox(true);
                  }}
                >
                  <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        );
      }
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    setNextStep(false);
    const {
      data: { data, count }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/material/${assemblyOrderData._id}`);

    let rows = data?.material?.filter((e) => !!e.parentId && e?.type === MATERIAL_TYPE.product);

    rows.forEach((parent, i) => {
      delete parent?.parentId;
      parent.index = i + 1;
      parent.detail = parent.productDetail?.productName || '';
      parent.description = parent?.productDetail?.productDescription || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.canDelete = false;
      if (parent?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        parent.canDelete = true;
      }
    });

    dispatch({ type: 'initialize', data: rows, count: count });
    dispatch({ type: 'loading', loading: false });
  };

  const handleDelete = async () => {
    setDeleting(true);
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: deleteData?.map((d) => d?.workOrder?.optionValue) })
      .then(({ data }) => {
        setDeleting(false);
        setShowConfirmBox(false);
        setCurrentStep((prevStep) => {
          const newStep = prevStep - 1;
          return newStep;
        });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        setShowConfirmBox(false);
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      {isAutoCreating && (
        <Box p={1} display="flex" alignItems="center">
          <SyncIcon className="rotate" /> <Typography variant="subtitle2">Work order Auto Creation in Progress </Typography>
        </Box>
      )}
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              selectedRecords,
              setDeleteData,
              setShowConfirmBox
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
        hasXpadding
      />
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
              expander={true}
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this item(s)`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default WorkOrder;

const ActionButtonMenuItems = ({ selectedRecords, setDeleteData, setShowConfirmBox }) => {
  return (
    <>
      <MenuItem
        onClick={() => {
          setDeleteData(selectedRecords?.filter((e) => e?.canDelete));
          setShowConfirmBox(true);
        }}
        disabled={selectedRecords?.some((e) => e?.canDelete) ? false : true}
      >
        Delete
      </MenuItem>
    </>
  );
};
