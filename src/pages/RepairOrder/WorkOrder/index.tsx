import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Menu, MenuItem, Chip, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { repairOrder, REPAIR_ORDER_TYPE, workOrder, WORKORDER_SERVICE_STATUS, WORK_ORDER_STATUS, CHILD_RESOURCE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { Delete, ExpandMore } from '@material-ui/icons';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { capitalize, sortBy } from 'lodash';
import { PreWorkIcon, PostWorkIcon } from 'src/assets/svg/svgIcons';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import UpdateWorkOrderDialog from './UpdateWorkOrderDialog';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { generateCustomTableColumns } from 'src/constants/columns';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const WorkOrder = ({
  repairOrderData,
  setNextStep,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  isPostWorkService,
  setCurrentStep,
  createNewVersionQuote
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false });
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [arrangeView, setArrangeView] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [isUpdating, setUpdating] = useState(false);
  const [allAssignedUsers, setAllAssignedUsers] = useState([]);
  const [updateDialog, setUpdateDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [repairOrderData]);

  useEffect(() => {
    const assignedUsersArrays = selectedProducts?.filter((product) => product?.assignedUsers).map((product) => product?.assignedUsers);
    const assignedUsers = assignedUsersArrays?.flat();

    const uniqueArray = assignedUsers.filter((obj, index, self) => index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj)));
    setAllAssignedUsers(uniqueArray);
  }, [selectedProducts]);

  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.workOrderService}`);
    var data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, repairOrderData?.currency || 'USD');
    const newColumns = generateCustomTableColumns(data, repairOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 250,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {row.original.type === 'service' ? (
              <p
                onClick={() => {
                  setUpdateDialog({
                    open: true,
                    data: row.original
                  });
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'serializedAsset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
            {row.original?.subRows?.length ? (
              <Box ml={1} className="d-flex align-items-center">
                {`(${row.original?.subRows?.length})`}
              </Box>
            ) : null}
            {user?.brandPolicy?.repairOrderQuotation && row.original.type === 'service' && (
              <Box ml={1}>
                {row?.original?.preWork ? (
                  <HtmlTooltip title="Pre Work Service">
                    <span>
                      <PreWorkIcon />
                    </span>
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip title="Post Work Service">
                    <span>
                      <PostWorkIcon />
                    </span>
                  </HtmlTooltip>
                )}
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'workOrderNumber',
        Header: 'Work Order',
        Cell: ({ row }) =>
          row.original['workOrder'] ? (
            <a className="link text-truncate" href={`${routes.workOrderDetail.path}/${row.original['workOrder']._id}`} target="_blank">
              {row.original['workOrderNumber']}
            </a>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original?.productName}>
              {row.original?.productName ? (
                row.original?.productId ? (
                  <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.productId}`} target="_blank">
                    {row.original?.productName}
                  </a>
                ) : (
                  row.original?.productName
                )
              ) : (
                <NoDataCell />
              )}
            </p>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'serviceStatus',
        Header: 'Result',
        Cell: ({ row }) => (row?.original['serviceStatus'] ? <p> {row?.original?.serviceStatus}</p> : <NoDataCell />)
      },
      {
        accessor: 'assignedUsers',
        Header: 'Assigned Technician',
        disableFilters: true,
        Cell: ({ row }) =>
          row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            row?.original['assignedUsers']?.map((e, i) => {
              return i === row?.original['assignedUsers'].length - 1 ? (
                <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`}>
                  {e?.optionLabel}
                </a>
              ) : (
                <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`}>
                  {e?.optionLabel},{' '}
                </a>
              );
            })
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        Cell: ({ row }) => (row.original['qty'] ? <p> {row?.original?.qty}</p> : <NoDataCell />)
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return row?.original?.type === 'service' || row?.original?.type === 'package' ? (
          <>
            <IconButton
              disabled={
                row?.original?.type === 'package' && row?.original?.subRows?.length === 0
                  ? false
                  : row?.original?.status === WORKORDER_SERVICE_STATUS.pending && allowedToDelete
                  ? false
                  : true
              }
              size="small"
              aria-label="Details"
              onClick={() => {
                setDeleteData([row.original]);
                setShowConfirmBox(true);
              }}
            >
              <Delete
                fontSize="small"
                color={
                  row?.original?.type === 'package' && row?.original?.subRows?.length === 0
                    ? 'error'
                    : row?.original?.status === WORKORDER_SERVICE_STATUS.pending && allowedToDelete
                    ? 'error'
                    : 'disabled'
                }
              />
            </IconButton>
          </>
        ) : row?.original?.type === 'serializedAsset' ? (
          <>
            <IconButton
              disabled={row.original?.subRows?.length === 0 ? false : true}
              size="small"
              aria-label="Details"
              onClick={() => {
                setDeleteData([row.original]);
                setShowConfirmBox(true);
              }}
            >
              <Delete fontSize="small" color={row.original?.subRows?.length === 0 ? 'error' : 'disabled'} />
            </IconButton>
          </>
        ) : null;
      }
    });
    setColumns(coloum);
  };

  const handleWorkOrderDelete = (ids) => {
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: ids })
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

  const handleDelete = () => {
    if (deleteData?.some((e) => e.type === 'service' || e.type === 'package')) {
      let ids = [];
      let workOrderId = '';
      if (deleteData.length > 0) {
        workOrderId = deleteData[0]?.workOrder?._id;
        deleteData.forEach((d) => {
          ids.push(d.uniqueId);
        });
      }
      setDeleting(true);
      axiosInstance()
        .put(`${workOrder.api}/service/${workOrderId}/remove`, {
          uniqueIds: ids
        })
        .then(({ data }) => {
          if (isPostWorkService && repairOrderData?.type === REPAIR_ORDER_TYPE.external) {
            createNewVersionQuote(true);
          }
          setDeleting(false);
          setShowConfirmBox(false);
          fetchData();
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
    } else {
      if (deleteData?.filter((e: any) => !e?.subRows?.length)?.length) {
        handleWorkOrderDelete(deleteData?.filter((e: any) => !e?.subRows?.length)?.map((e) => e.workOrder?._id));
      }
    }
  };

  const fetchData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/work-order/service`);
    data = response?.data?.data;

    const rows = data.material?.filter((e) => e.parentId === null);

    createWorkorderService(rows);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceName
          : parent.type === 'product'
          ? parent?.productDetail?.productName
          : parent.type === 'serializedAsset'
          ? parent?.serializedAsset?.assetNumber
          : parent?.packageDetail?.packageName
      }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
          ? parent?.productDetail?.productDescription || ''
          : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription || ''
          : parent.type === 'serializedAsset'
          ? parent?.serializedAssetDetail?.product?.productDescription || ''
          : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qty = parent.qty;
      parent.status = `${
        parent.type === 'service'
          ? parent.serviceDetail?.status
          : parent.type === 'product'
          ? parent.productDetail?.status
          : parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail.status
          : parent.packageDetail?.status
      }`;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      parent.hideSelection = false;
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        parent.hideSelection = true;
        parent.serviceStatus = parent?.workOrder?.status;
      }
      parent.subRows = generateNestedData(data.material, parent);
    });

    if (isPostWorkService) {
      if (rows?.some((e) => e.serviceStatus === WORK_ORDER_STATUS.completed)) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    } else {
      if (
        data?.material?.filter(
          (e) =>
            e?.type === 'service' &&
            e?.serviceDetail?.preWork &&
            [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.sort()?.includes(e?.status)
        )?.length
      ) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id)?.sort((a, b) => b?.serviceDetail?.preWork - a?.serviceDetail?.preWork);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'serializedAsset'
          ? _subRow?.serializedAsset?.assetNumber
          : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.preWork = _subRow.type === 'service' ? _subRow?.serviceDetail?.preWork : false;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderNumber = parent?.workOrder?.workOrderNumber;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++;
      _subRow.isValid = true;
      _subRow.hideSelection = false;
      if (_subRow?.status === WORKORDER_SERVICE_STATUS.completed) {
        _subRow.hideSelection = true;
      }
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return sortBy(
      subRows?.filter((e) => e.type !== 'product'),
      ['type']
    );
  };

  const handleAddService = (ids) => {
    const allWorkOrders = selectedProducts?.map((e) => e.workOrder?._id);
    const data: any = {};
    data.serviceIds = ids;
    data.workOrderIds = [...new Set(allWorkOrders)];
    axiosInstance()
      .post(`${workOrder.api}/service`, data)
      .then(() => {
        if (isPostWorkService && repairOrderData?.type === REPAIR_ORDER_TYPE.external) {
          createNewVersionQuote(true);
        }
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const createWorkorderService = (rows) => {
    const rowsForWorkorder = rows.filter((d) => d.type === 'serializedAsset' && !d.workOrder);
    if (rowsForWorkorder.length > 0) {
      const tempInitialData = rowsForWorkorder.map((element) => {
        return {
          _id: element?._id,
          product: element?.serializedAsset?.product,
          serializedAsset: element?.serializedAsset?._id
        };
      });
      axiosInstance()
        .post(`${repairOrder.api}/${repairOrderData._id}/work-order/create-many`, tempInitialData)
        .then(({ data }) => {
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleArrangeUpdate = (rows: any[], workOrderId) => {
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchData();
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSaveData = async (rows: any) => {
    setUpdating(true);
    rows.forEach((element) => {
      delete element.index;
      delete element.detail;
      delete element.isValid;
      delete element.hideSelection;
    });
    const workOrderId = rows[0]?.workOrder?._id;
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData._id}/work-order/${workOrderId}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setUpdateDialog({ open: false, data: null });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box display="flex" alignItems="center" justifyContent={'flex-end'} gridColumnGap={8} flex={1} m={1} my={1}>
        {allowedToEdit && (
          <Box display="flex" gridColumnGap={5}>
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedProducts?.length === 0}
              endIcon={<ExpandMore />}
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorActionEl)}
              onClose={closeActions}
            >
              <MenuItem
                onClick={() => {
                  closeActions();
                  setAddServicesDialog({ open: true });
                }}
              >
                Add Services
              </MenuItem>
              <MenuItem
                disabled={selectedProducts?.filter((d) => d.type === 'service')?.length > 0 ? false : true}
                onClick={() => {
                  closeActions();
                  setUserAssignDialog(true);
                }}
              >
                Assign Technician
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeActions();
                  setArrangeView(true);
                }}
                disabled={
                  selectedProducts?.length && selectedProducts?.every((d) => d.workOrder?._id === selectedServices[0]?.workOrder?._id) ? false : true
                }
              >
                Arrange Services
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDeleteData(selectedServices?.length ? selectedServices : selectedAssets);
                  setShowConfirmBox(true);
                  closeActions();
                }}
                disabled={
                  selectedProducts?.filter((e) => e.type === 'service').length
                    ? selectedServices?.filter(
                        (d) =>
                          d.type === 'service' &&
                          d.workOrder?._id === selectedServices[0]?.workOrder?._id &&
                          d.status === WORKORDER_SERVICE_STATUS.pending
                      )?.length === selectedServices?.length
                      ? false
                      : true
                    : selectedAssets?.length
                    ? selectedAssets?.filter((d) => rowsData?.filter((c) => c?._id === d?._id)?.some((d) => !d?.subRows?.length))?.length ===
                      selectedAssets?.length
                      ? false
                      : true
                    : true
                }
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box zIndex={5} width={'100%'}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                columns={columns}
                data={rowsData}
                onSelect={(data) => {
                  setSelectedServices(data?.filter((d) => d.type === 'service' && !d.hideSelection) || []);
                  setSelectedAssets(data?.filter((d) => d.type === 'serializedAsset' && !d.hideSelection) || []);
                  setSelectedProducts(data?.filter((d) => !d.hideSelection) || []);
                }}
                setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={allowedToEdit ? false : isPostWorkService ? false : true}
                hideAction={allowedToEdit ? false : isPostWorkService ? false : true}
                renderedFrom="repair_order_workorder"
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
          {addServicesDialog.open && (
            <AssignServiceDialog
              reference="repairOrder"
              handleClose={() => setAddServicesDialog({ open: false })}
              ids={[]}
              onSuccess={(data) => {
                handleAddService(data?.map((e) => e._id));
                setAddServicesDialog({ open: false });
              }}
              extraStaticFilter={!isPostWorkService ? [] : [{ field: 'preWork', term: false }]}
            />
          )}
          {userAssignDialog && (
            <AssignUserDialog
              workOrderData={selectedProducts
                .filter((e) => e.type === 'service')
                .map((d) => {
                  return {
                    uniqueId: d?.uniqueId,
                    workOrderId: d?.workOrder?._id
                  };
                })}
              assignedUsers={allAssignedUsers}
              handleClose={() => {
                setUserAssignDialog(false);
              }}
              handleSucess={() => {
                fetchData();
                setUserAssignDialog(false);
              }}
            />
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
          {arrangeView && (
            <ArrangeView
              data={
                selectedServices
                  ?.filter((e) => e.type === 'service')
                  ?.map((d) => {
                    return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork };
                  }) || []
              }
              title={'Arrange Services'}
              handleClose={() => setArrangeView(false)}
              handleSubmit={(data) => handleArrangeUpdate(data, selectedServices[0]?.workOrder?._id)}
              loading={false}
            />
          )}
          {updateDialog.open && (
            <UpdateWorkOrderDialog
              onClose={() => {
                setUpdateDialog({ open: false, data: null });
              }}
              materialData={updateDialog.data}
              handleUpdate={handleSaveData}
              loadingEdit={isUpdating}
              repairOrderData={repairOrderData}
            />
          )}
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default WorkOrder;
