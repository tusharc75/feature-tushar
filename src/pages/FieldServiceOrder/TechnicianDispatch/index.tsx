import { Box, IconButton, MenuItem } from '@mui/material';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import SendIcon from '@material-ui/icons/Send';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { dateTimeFormat, fieldServiceOrder } from '../../../constants/helpers';
import DispatchMaterial from './DispatchMaterial';
import { FiExternalLink } from 'react-icons/fi';

const TechnicianDispatch = ({ serviceOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }: any) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [showDispatchMaterial, setShowDispatchMaterial] = useState({ open: false, data: [] });
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    const column: any = [
      {
        accessor: 'service',
        Header: ' Service',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original?.service?.serviceName}
            <IconButton
              size="small"
              style={{ marginLeft: '10px' }}
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original?.service?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'technician',
        Header: 'Technician',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {`${row.original?.technician?.firstName} ${row.original?.technician?.lastName} - (${row.original?.technician?.employeeNumber})`}
            <IconButton
              size="small"
              style={{ marginLeft: '10px' }}
              onClick={() => {
                window.open(`${routes.employeeMasterDetail.path}/${row.original?.technician?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => {
          return row.original['status'] ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'estimateStartDate',
        Header: 'Estimate Start Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['estimateStartDate'] ? <p>{moment(row.original['estimateStartDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'estimateEndDate',
        Header: 'Estimate End Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['estimateEndDate'] ? <p>{moment(row.original['estimateEndDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      }
    ];
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
        return allowedToEdit ? (
          row.original.status === 'Assigned' ? (
            <HtmlTooltip title={'Dispatch'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Dispatch"
                  onClick={() => {
                    const obj: any = [
                      {
                        _id: row.original._id,
                        technician: row.original?.technician?._id,
                        material: row.original?.material
                      }
                    ];
                    if (row.original?.material?.length) {
                      setShowDispatchMaterial({ open: true, data: obj });
                    } else {
                      handleDispatch(obj);
                    }
                  }}
                >
                  <SendIcon fontSize="small" color={'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : row.original.status === 'Dispatched' ? (
            <HtmlTooltip title={'Complete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Complete"
                  onClick={() => {
                    const obj: any = [{ _id: row.original._id, technician: row.original?.technician?._id }];
                    handleCompleted(obj);
                  }}
                >
                  <CheckCircleIcon fontSize="small" color={'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : null
        ) : null;
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/material`);
    data = response?.data?.data?.material;

    const responseTechnician = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/technician`);
    const technician = responseTechnician?.data?.data;

    const rows: any = [];

    data
      .filter((e) => e.parentId === null && e.type === 'service')
      .forEach((parent, i) => {
        technician
          .filter((e) => e.uniqueId === parent._id)
          ?.forEach((element, i) => {
            const obj: any = {};
            obj._id = element._id;
            // obj._id = parent._id;
            obj.service = parent.serviceDetail;
            obj.technician = element?.technician;
            obj.estimateStartDate = element?.estimateStartDate;
            obj.estimateEndDate = element?.estimateEndDate;
            obj.material = data?.filter((ele) => ele.parentId === parent._id && ele.type === 'product');
            obj.status = element?.status;
            rows.push(obj);
          });
      });
    if (rows.some((d) => d.status !== 'Completed')) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleDispatch = (rows) => {
    axiosInstance()
      .put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/technician/dispatched`, rows)
      .then(({ data }) => {
        setShowDispatchMaterial({ open: false, data: [] });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleCompleted = (rows) => {
    axiosInstance()
      .put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/technician/complete`, rows)
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.filter((e) => e.status === 'Assigned')?.length === selectedRecords?.length ? false : true}
          onClick={() => {
            const obj: any = selectedRecords.map((ele) => {
              return {
                _id: ele?._id,
                technician: ele?.technician?._id,
                material: ele?.material?.map((e) => {
                  return { _id: e._id, type: 'product', product: e.materialId };
                })
              };
            });
            handleDispatch(obj);
          }}
        >
          Dispatched
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.filter((e) => e.status === 'Dispatched')?.length === selectedRecords?.length ? false : true}
          onClick={() => {
            const obj: any = selectedRecords.map((ele) => {
              return { _id: ele?._id, technician: ele?.technician?._id };
            });
            handleCompleted(obj);
          }}
        >
          Completed
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <DetailsPageHeader
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.length) }}
          actionButtonMenuItems={actionButtonMenuItems()}
          isAddButtonVisible={false}
          hasXpadding
        />
      )}
      <>
        {columns ? (
          <Box zIndex={5}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </>
      {showDispatchMaterial.open && (
        <DispatchMaterial
          handleClose={() => {
            setShowDispatchMaterial({ open: false, data: [] });
          }}
          data={showDispatchMaterial.data}
          handleSubmit={(rows) => {
            handleDispatch(rows);
          }}
        />
      )}
    </Fragment>
  );
};

export default TechnicianDispatch;
