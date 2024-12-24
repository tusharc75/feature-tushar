import { Box, Button, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, SERVICE_ORDER_STATUS, fieldServiceOrder, warehouse } from '../../../constants/helpers';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Technician = ({
  serviceOrderData,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  fromInvoice = false,
  statusOptions = [],
  updateStatus = null
}: any) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [addEmployeeMasterDialog, setAddEmployeeMasterDialog] = useState({ open: false, data: null });
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    if (fromInvoice) {
      if ([SERVICE_ORDER_STATUS.new, SERVICE_ORDER_STATUS.inProgress]?.includes(serviceOrderData?.status)) {
        updateStatus(SERVICE_ORDER_STATUS.readyToInvoice);
      }
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [allowedToEdit]);

  useEffect(() => {
    fetchData();
  }, [columns, serviceOrderData]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.fieldServiceOrderDetails, serviceOrderData?.currency, false);
    const newColumns = generateColumns(renderedFrom, data, null, false, serviceOrderData?.currency);
    var column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        width: 250,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.detail}
            <IconButton
              size="small"
              style={{ marginLeft: '10px' }}
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.employeeMasterDetail.path}/${row.original.technician}`);
                }
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
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
      }
    ];
    column = [...column, ...newColumns];
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
        return allowedToEdit && row.original.type === 'technician' ? (
          <HtmlTooltip title={'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setDeleteData([row.original._id]);
                }}
              >
                <DeleteIcon fontSize="small" color={'error'} />
              </IconButton>
            </span>
          </HtmlTooltip>
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

    const responseTechnician = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/technician`);
    const technician = responseTechnician?.data?.data;

    data = response?.data?.data?.material?.filter((e) => e.type !== 'product');
    let rows = data.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent?.productDetail?.productName
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent?.packageDetail?.packageName;
      parent.competencies = parent.type === 'service' ? parent?.serviceDetail?.competencies?.map((e) => e?.optionLabel)?.join(', ') : null;
      parent.competencyType = parent.type === 'service' ? parent?.serviceDetail?.competencyType?.optionLabel : null;
      parent.mainCompetencyType = parent.type === 'service' ? parent?.serviceDetail?.competencyType : {};
      parent.status = serviceOrderData?.status;
      parent.subRows = generateNestedData(data, technician, parent);
    });

    if (technician?.length) {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, technician, parent) => {
    const subRowsTechnician: any = [];
    technician
      ?.filter((e) => e.uniqueId === parent._id)
      ?.forEach((element, i) => {
        const obj: any = {};
        obj._id = element._id;
        obj.index = parent.index + '.' + (i + 1);
        obj.detail = `${element?.technician?.firstName} ${element?.technician?.lastName} - (${element?.technician?.firstName})`;
        obj.technician = element?.technician?._id;
        obj.type = 'technician';
        obj.estimateStartDate = element?.estimateStartDate;
        obj.estimateEndDate = element?.estimateEndDate;
        obj.status = element?.status;
        parent.isValid = true;
        subRowsTechnician.push(obj);
      });

    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName;
      _subRow.subRows = generateNestedData(material, technician, _subRow);
    });

    return [...subRowsTechnician, ...subRows];
  };

  const handleAssignTechnician = async (rows) => {
    const sendData: any = [];
    rows?.forEach((e) => {
      sendData.push({
        uniqueId: selectedRecords[0]?._id,
        service: selectedRecords[0]?.materialId,
        technician: e?._id,
        estimateStartDate: selectedRecords[0]?.estimateStartDate,
        estimateEndDate: selectedRecords[0]?.estimateEndDate,
        warehouse: selectedRecords[0]?.warehouse
      });
    });
    axiosInstance()
      .post(`${fieldServiceOrder.api}/${serviceOrderData._id}/technician`, sendData)
      .then(() => {
        setAddEmployeeMasterDialog({ open: false, data: null });
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (ids) => {
    setDeleting(true);
    axiosInstance()
      .put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/technician/delete`, { ids })
      .then(() => {
        fetchData();
        setDeleting(false);
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        setDeleteData(null);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    selectedRecords
      ?.filter((e) => e.type === 'technician')
      ?.forEach((ele) => {
        obj.push(ele._id);
      });
    setDeleteData(obj);
  };

  const rightSideContents = () => {
    return (
      <>
        <Button
          variant="contained"
          color="primary"
          type="button"
          size="small"
          disabled={selectedRecords?.length === 1 ? false : true}
          onClick={() => {
            setAddEmployeeMasterDialog({ open: true, data: selectedRecords[0] });
          }}
        >
          {`Assign Technician`}
        </Button>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={isDeleting}
          onClick={() => {
            handleDeleteMultiple();
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <DetailsPageHeader
          isAddButtonVisible={false}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: !Boolean(selectedRecords?.length && selectedRecords?.filter((e) => e.type === 'technician').length) }}
          rightSideContents={rightSideContents()}
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
              expander={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </>
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {addEmployeeMasterDialog.open && (
        <AssignEmployeeDialog
          reference={'service'}
          onSuccess={(data) => {
            handleAssignTechnician(data);
          }}
          handleClose={() => {
            setAddEmployeeMasterDialog({ open: false, data: null });
          }}
          defaultCompetency={[addEmployeeMasterDialog?.data?.mainCompetencyType]}
          warehouse={serviceOrderData?.warehouse?.optionValue}
        />
      )}
    </Fragment>
  );
};

export default Technician;
