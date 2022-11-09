import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Menu, MenuItem, Chip, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { repairOrder, workOrder, sidebarResource, getObjKeys, generateUniqueIdOnly, WORKORDER_SERVICE_STATUS } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { Delete, ExpandMore } from '@material-ui/icons';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import RestoreIcon from '@material-ui/icons/Restore';
import UpdateIcon from '@material-ui/icons/Update';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { sortBy } from 'lodash';
import SendEmail from 'src/pages/Quotation/SendEmail';

const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

const WorkOrder = ({ repairOrderData, setNextStep, isTabletScreen, isSmallScreen, showActivity, stepFullScreen, allowedToEdit, allowedToDelete, isPostWorkService }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();
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
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original.detail}</p>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>
            <Chip
              className="ml-1"
              label={`${row.original.type === 'service' ? 'Service' : row.original.type === 'product' ? 'Product' : row.original.type === 'serializedAsset' ? 'Asset' : 'Package'}`}
              size="small"
              color="primary"
              onClick={() => {
                window.open(`${row.original.type === 'service' ? routes.serviceMasterDetail.path : row.original.type === 'product' ? routes.productDetail.path
                  : row.original.type === 'serializedAsset' ? routes.serializedAsset.path : routes.packagesDetail.path}/${row.original.materialId}`
                );
              }}
            />
            {row.original.type === 'service' && (
              <Box ml={1}>
                {row?.original?.preWork ? (
                  <HtmlTooltip title="Pre Work Service">
                    <RestoreIcon fontSize="small" />
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip title="Post Work Service">
                    <UpdateIcon fontSize="small" />
                  </HtmlTooltip>
                )}
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
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
        accessor: 'assignedUsers',
        Header: 'Assigned Users',
        Cell: ({ row }) =>
          row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ?
            <p>{row?.original?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}</p> : <NoDataCell />
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        Cell: ({ row }) => (row.original['qty'] ? <p> {row?.original?.qty}</p> : <NoDataCell />)
      }
      // {
      //     accessor: 'unit',
      //     Header: 'Unit',
      //     Cell: ({ row }) => (
      //         row.original['unit'] ?
      //             <p> {row?.original?.unit}</p>
      //             : <NoDataCell />
      //     )
      // },
    ];

    setColumns([...coloum, {
      accessor: 'action',
      Header: '',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return row?.original?.type === 'service' && (
          <>
            <IconButton
              disabled={!allowedToDelete}
              size="small"
              aria-label="Details"
              onClick={() => {
                setDeleteData([row.original]);
                setShowConfirmBox(true)
              }}
            >
              <Delete fontSize="small" color="error" />
            </IconButton>
          </>
        )
      }
    }]);

  };

  const handleDelete = () => {
    let ids = []
    let workOrderId = ''
    if (deleteData.length > 0) {
      workOrderId = deleteData[0]?.workOrder?._id
      deleteData.forEach((d) => {
        ids.push(d.uniqueId);
      })
    }
    setDeleting(true)
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/remove`, {
        uniqueIds: ids
      })
      .then(({ data }) => {
        setDeleting(false)
        setShowConfirmBox(false);
        fetchData()

        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        setShowConfirmBox(false);
        setDeleting(false)

        toastConfig.setToastConfig(err);
      });
  }

  const fetchData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/work-order/service`);
    data = response?.data?.data;
    const rows = data.material.filter((e) => e.parentId === null);
    createWorkorderService(rows);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'service' ? parent?.serviceDetail?.serviceName : parent.type === 'product' ? parent?.productDetail?.productName :
        parent.type === 'serializedAsset' ? parent?.serializedAsset?.assetNumber : parent?.packageDetail?.packageName}`;
      parent.qty = parent.qty;
      parent.status = parent?.workOrder?.status;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      parent.subRows = generateNestedData(data.material, parent);
    });

    if (isPostWorkService) {
      if (data?.material?.filter((e) => e?.type === 'service' && !e?.serviceDetail?.preWork
        && [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.sort()?.includes(e?.status))?.length) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    }
    else {
      if (data?.material?.filter((e) => e?.type === 'service' && e?.serviceDetail?.preWork
        && [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.sort()?.includes(e?.status))?.length) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };


  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : (productIndex + 1)}`;
      _subRow.detail = _subRow.type === 'service' ? _subRow?.serviceDetail?.serviceName : _subRow.type === 'product' ? _subRow?.productDetail?.productName :
        _subRow.type === 'serializedAsset' ? _subRow?.serializedAsset?.assetNumber : _subRow?.packageDetail?.packageName;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.preWork = _subRow.type === 'service' ? _subRow?.serviceDetail?.preWork : false;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderNumber = parent?.workOrder?.workOrderNumber;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++
      _subRow.isValid = true;
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return sortBy(subRows, ['type']);
  };

  const handleAddService = (ids) => {
    const data: any = {};
    data.serviceIds = ids;
    axiosInstance().post(`${workOrder.api}/service/${selectedProducts[0]['workOrder']?._id}`, data).then(() => {
      fetchData();
    }).catch((err) => {
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

  return (
    <Fragment>
      <Box display="flex" justifyContent="flex-end" pt={1} pb={2}>
        <Box display="flex" alignItems="center" justifyContent={'flex-end'} paddingX={1} gridColumnGap={8} flex={1}>
          {allowedToEdit && (
            <Box display="flex" gridColumnGap={5}>
              {!isPostWorkService && <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedProducts.length === 0}
              >
                Actions <ExpandMore />
              </Button>}
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
                  onClick={() => {
                    closeActions();
                    setUserAssignDialog(true);
                  }}
                >
                  Assign Users
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeActions();
                    setArrangeView(true);
                  }}
                  disabled={services?.every((d) => d.workOrder?._id === services[0].workOrder?._id) ? false : true}
                >
                  Arrange Services
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setDeleteData(services)
                    setShowConfirmBox(true)
                    closeActions();
                  }}
                  disabled={services?.every((d) => d.workOrder?._id === services[0].workOrder?._id) ? false : true}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box
              zIndex={5}
              width={
                stepFullScreen
                  ? '100%'
                  : isTabletScreen
                    ? 'calc(100vw)'
                    : isSmallScreen
                      ? 'calc(100vw)'
                      : showActivity
                        ? '100%'
                        : 'calc(100vw - 103px)'
              }
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
            >
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
                columns={columns}
                data={rowsData}
                onSelect={(data) => {
                  setServices(data?.filter((d) => d.type === 'service') || []);
                  setSelectedProducts(data);
                }}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={!allowedToEdit || isPostWorkService}
                renderedFrom="repair_order_workorder"
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
          {addServicesDialog.open && (
            <AssignServiceDialog
              reference="workorder"
              handleClose={() => setAddServicesDialog({ open: false })}
              ids={[]}
              onSuccess={(data) => {
                handleAddService(data?.map((e) => e.service));
                setAddServicesDialog({ open: false });
              }}
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
              assignedUsers={[]}
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
                services
                  ?.filter((e) => e.type === 'service')
                  ?.map((d) => {
                    return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork };
                  }) || []
              }
              title={'Arrange Services'}
              handleClose={() => setArrangeView(false)}
              handleSubmit={(data) => handleArrangeUpdate(data, services[0].workOrder?._id)}
              loading={false}
            />
          )}
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default WorkOrder;
