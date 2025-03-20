import { IconButton, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { AccessorFunction, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  displayDate,
  FIELD_SERVICE_ORDER_TECHNICIAN_STATUS,
  fieldServiceOrder,
  MATERIAL_TYPE,
  prepareDataForGrid,
  sidebarResource
} from 'src/constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { Link } from 'react-router-dom';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Send } from '@mui/icons-material';
import ReplayIcon from '@mui/icons-material/Replay';
import ReturnQtyDialog from './ReturnQtyDialog';

const TechnicianDispatchReturn = ({ allowedToEdit, serviceOrderId, stepFullScreen, setNextStep, isReturn = false }) => {

  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_TechnicianDispatch`;

  if (isReturn) renderedFrom.replace('Dispatch', 'Return');

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({ open: false, data: null });
  const [productQtyToReturnDialog, setProductQtyToReturnDialog] = useState({ open: false, data: null });
  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [isReturn]);

  const fetchColumns = async () => {
    setColumns(null);
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <h5 className="text-truncate">{row?.original?.index}</h5>
          </div>
        )
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{startCase(row.original?.type)}</p> : <NoDataCell />)
      },
      {
        accessor: 'details',
        Header: 'Details',
        width: 250,
        Cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <p className="text-truncate" title={row.original.type === 'technician' ? row.original.technicianName : row.original.productName}>
                {row.original.type === 'technician' ? row.original.technicianName : row.original.productName}
              </p>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'technician') {
                    window.open(`${routes.employeeMasterDetail.path}/${row.original.technicianId}`);
                  } else {
                    window.open(`${routes.productDetail.path}/${row.original.productId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          );
        }
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 250,
        Cell: ({ row }) => row?.original?.qty ? <h5 className="text-truncate">{row?.original?.qty}</h5> : <NoDataCell />
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (
          <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'competencyType',
              lookupResource: sidebarResource.competencyType
            }}
            original={row?.original}
          />
        ),
        accessorFn: (original) => AccessorFunction(original, 'competencies'),
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (
          <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'competencies',
              lookupResource: sidebarResource.competencies
            }}
            original={row?.original}
          />
        ),
        accessorFn: (original) => AccessorFunction(original, 'competencies'),
      },
      {
        accessor: 'dispatchedDate',
        Header: 'Dispatched Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDate(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'dispatchedBy',
        Header: 'Dispatched By',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row?.original?.startedById ? (
            <Link
              className="link text-truncate"
              title={row?.original?.startedBy}
              to={`${routes.userDetail.path}/${row?.original?.startedById}`}
              target={'_blank'}
            >
              {row?.original?.startedBy}
            </Link>
          ) : (
            <NoDataCell />
          )
      }
    ];
    if (isReturn) {
      column.push(
        {
          accessor: 'returnedDate',
          Header: 'Returned Date',
          disableFilters: true,
          disableSortBy: true,
          width: 250,
          Cell: ({ row }) => (row.original?.endDate ? <p>{displayDate(row.original?.endDate)}</p> : <NoDataCell />)
        },
        {
          accessor: 'returnedBy',
          Header: 'Returned By',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) =>
            row?.original?.endedById ? (
              <Link
                className="link text-truncate"
                title={row?.original?.endedBy}
                to={`${routes.userDetail.path}/${row?.original?.endedById}`}
                target={'_blank'}
              >
                {row?.original?.endedBy}
              </Link>
            ) : (
              <NoDataCell />
            )
        }
      );
    }
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        const isDisabled = (isReturn && !row?.original?.startDate) || row?.original?.endDate || (!isReturn && row?.original?.startDate);
        return allowedToEdit ? (
          <HtmlTooltip
            title={
              isDisabled
                ? isReturn
                  ? !row?.original?.startDate
                    ? 'Not Dispatched Yet'
                    : 'Already Returned'
                  : 'Already Dispatched'
                : isReturn
                  ? 'Return'
                  : 'Dispatch'
            }
          >
            <span>
              <IconButton
                size="small"
                disabled={isDisabled}
                onClick={() => {
                  if (isReturn) {
                    setProductQtyToReturnDialog({ open: true, data: [row?.original, ...(row?.original?.subRows || [])] });
                  } else {
                    setConfirmationDialog({ open: true, data: [row?.original] });
                  }
                }}
              >
                {isReturn ? (
                  <ReplayIcon fontSize="small" color={isDisabled ? 'disabled' : 'primary'} />
                ) : (
                  <Send fontSize="small" color={isDisabled ? 'disabled' : 'primary'} />
                )}
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : null;
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let products = [];
    const productResponce = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderId}/material?type=${MATERIAL_TYPE.product}`)
    products = productResponce?.data?.data?.material?.map((u, i) => {
      let res: any = {
        ...prepareDataForGrid(u)
      };
      res.productName = u?.productDetail?.productName;
      res.productId = u?.productDetail?._id;
      return res;
    });

    const technicianResponce = await axiosInstance().get(`${fieldServiceOrder.api}/technician?fieldServiceOrder=${serviceOrderId}`)
    let rows = technicianResponce?.data?.data?.technician?.map((u, i) => {
      let res: any = {
        ...prepareDataForGrid(u)
      };
      res.index = i + 1;
      res.type = 'technician';
      res.technicianName = u?.technician['firstName'] + ' ' + u?.technician['lastName'];
      res.technicianId = u?.technician['_id'];
      res.competencyType = u?.technician?.competencyType;
      res.competencies = u?.technician?.competencies;
      res.subRows = products?.filter((p) => p?.technicianId === u?.technician['_id'])?.map((p, j) => {
        return {
          index: `${i + 1}.${j + 1}`,
          parentId: u?._id,
          ...p
        };
      });
      return res;
    });
    const startCount = rows?.length + 1;
    products?.filter((p) => !p?.technician)?.forEach((p, i) => {
      rows?.push({
        index: startCount + i,
        ...p
      });
    });

    if (rows?.some((r) => r?.status === FIELD_SERVICE_ORDER_TECHNICIAN_STATUS.dispatched)) {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleDispatch = (data) => {
    setSubmitting(true);
    let technicians = new Set();
    let products = [];
    data?.forEach((d: any) => {
      if (d?.parentId && d?.type === MATERIAL_TYPE.product) {
        technicians.add(d?.parentId);
      } else if (d?.type === 'technician') {
        technicians.add(d?._id);
      } else {
        products.push(d?._id);
      }
    });
    axiosInstance().post(`${fieldServiceOrder.api}/technician/dispatch`, {
      technicians: Array.from(technicians),
      products: products,
      fieldServiceOrder: serviceOrderId
    }).then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });
      setSubmitting(false);
      setConfirmationDialog({ open: false, data: null });
      fetchData();
    }).catch((error) => {
      toastConfig.setToastConfig(error);
      setSubmitting(false);
    });
  };

  const handleReturn = (data, products) => {
    setSubmitting(true);
    let technicians = [];
    data?.forEach((d: any) => {
      if (d?.type === 'technician') {
        technicians.push(d?._id);
      }
    });
    axiosInstance().post(`${fieldServiceOrder.api}/technician/return`, {
      technicians: technicians,
      products: products?.map((p) => ({
        _id: p?._id,
        returnQty: p?.returnQty
      })),
      fieldServiceOrder: serviceOrderId
    }).then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });
      setSubmitting(false);
      setProductQtyToReturnDialog({ open: false, data: null })
      fetchData();
    }).catch((error) => {
      toastConfig.setToastConfig(error);
      setSubmitting(false);
    });
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <HtmlTooltip title={`${isReturn ? 'Return' : 'Dispatch'} Technicians`}>
          <MenuItem
            disabled={
              submitting ||
              (isReturn && selectedRecords?.some((d) => !d?.startDate)) ||
              (!isReturn && selectedRecords?.some((d) => d?.startDate)) ||
              selectedRecords?.some((d) => d?.endDate)
            }
            onClick={() => {
              if (isReturn) {
                setProductQtyToReturnDialog({ open: true, data: selectedRecords });
              } else {
                setConfirmationDialog({ open: true, data: selectedRecords });
              }
            }}
          >
            {isReturn ? 'Return' : 'Dispatch'}
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={false}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
            hasXpadding
          />
        </>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
          {columns ? (
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              refreshGrid={fetchData}
              expander={true}
            />
          ) : (
            <Box p={2} height={300}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {confirmationDialog.open && (
        <ConfirmationDialog
          open={confirmationDialog.open}
          message={`Are you sure you want to ${isReturn ? 'return' : 'dispatch'} selected records?`}
          onClose={() => {
            setConfirmationDialog({ open: false, data: null });
          }}
          onOk={() => {
            handleDispatch(confirmationDialog.data);
          }}
          okBtnLoading={submitting}
        />
      )}
      {productQtyToReturnDialog.open && (
        <ReturnQtyDialog
          products={productQtyToReturnDialog.data?.filter((d) => d?.type === MATERIAL_TYPE.product)}
          loading={submitting}
          handleClose={() => setProductQtyToReturnDialog({ open: false, data: null })}
          handleSuccess={(products) => handleReturn(productQtyToReturnDialog.data, products)}
        />
      )}
    </>
  );
};

export default TechnicianDispatchReturn;
