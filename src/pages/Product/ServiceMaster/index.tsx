import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { product, gridPageSizes, serviceMaster } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AddServiceMaster from './AddServiceMaster';
import { HiBadgeCheck } from 'react-icons/hi';
import { FcApproval } from 'react-icons/fc';
import { GrDrag } from 'react-icons/gr';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { ExpandMore } from '@material-ui/icons';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { flattenArray } from 'src/constants/columns';
import AssignStepDialog from './AssignStepDialog/Index';

interface Props {
  renderedFrom: string;
  id: string;
}

const ServiceMaster = (props: Props) => {
  const { renderedFrom, id } = props;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [arrangeView, setArrangeView] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [orignalData, setOrignalData] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [dataRows, setDataRows] = useState([]);

  const [assignProductDialog, setAssignProductDialog] = useState({ open: false, products: null, service: null, uniqueId: null, steps: null });

  const [assignStepsToConsumablesDialog, setAssignStepsToConsumablesDialog] = useState({
    open: false,
    consumables: null,
    service: null,
    steps: null
  });

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    getServiceMasterColumns();
    fetchData();
  }, [selectedEntity, id]);

  const getServiceMasterColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serviceMaster.resource}`)
      .then(({ data: { data } }) => {
        fetchGridColumns(data);
      });
  };

  const fetchGridColumns = (serviceColumns: any) => {
    const columns: any = [
      {
        accessor: 'order',
        Header: 'Sequence',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.order || <NoDataCell />}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 80,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${row.original?.type || <NoDataCell />} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <Link
            className="link"
            title={row.original?.detail}
            to={
              row.original?.type !== 'Product'
                ? `${routes.serviceMasterDetail.path}/${row.original?.serviceId}`
                : `${routes.productDetail.path}/${row.original?.product}`
            }
          >
            {row.original?.detail || <NoDataCell />}
          </Link>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        minWidth: 200,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {row.original?.description ? (
              <p className="text-truncate" title={row.original?.description}>
                {row.original?.description}
              </p>
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 150,
        minWidth: 150,
        editable: permissions?.product?.isUpdate ? true : false,
        Cell: ({ row }) => (row.original?.qty ? <p>{row.original?.qty}</p> : <NoDataCell />)
      },
      {
        accessor: 'stepName',
        Header: 'Step Name',
        width: 100,
        Cell: ({ row }) =>
          row.original?.stepName ? (
            <p title={row.original?.stepName} className="text-truncate">
              {row.original?.stepName}
            </p>
          ) : (
            <NoDataCell />
          )
      }
    ];

    if (serviceColumns && serviceColumns?.some((column) => column?.fieldData?.fieldName === 'preWork')) {
      columns.push({
        accessor: 'preWork',
        Header: 'Pre Work',
        width: 70,
        Cell: ({ row }) => (row.original?.preWork ? <p className="text-truncate">{row.original?.preWork}</p> : <NoDataCell />)
      });
    }
    if (serviceColumns && serviceColumns?.some((column) => column?.fieldData?.fieldName === 'serviceType')) {
      columns.push({
        accessor: 'serviceType',
        Header: 'Service Type',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {row.original?.serviceType ? <p>{row.original?.serviceType}</p> : <NoDataCell />}
          </div>
        )
      });
    }

    columns.push({
      accessor: 'action',
      Header: 'Action',
      width: 130,
      minWidth: 130,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }: any) => (
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          {permissions?.product?.isUpdate && row.original?.type === 'Service' && (
            <HtmlTooltip title="Add Consumables">
              <IconButton
                size="small"
                aria-label="Delete"
                color="primary"
                onClick={() => {
                  const subProduct = row.original?.subRows?.map((item) => item?.product);
                  setAssignProductDialog({
                    open: true,
                    products: subProduct || [],
                    service: row.original?.serviceId,
                    uniqueId: row.original?._id,
                    steps: row.original?.steps || []
                  });
                }}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </HtmlTooltip>
          )}
          {permissions?.product?.isUpdate &&
            row.original?.type === 'Service' &&
            (row.original?.default ? (
              <HtmlTooltip title={'Remove Default'}>
                <IconButton
                  aria-label={'Default'}
                  size="small"
                  onClick={() => {
                    handleUpdate({
                      ids: [row.original?._id],
                      default: !row.original?.default
                    });
                  }}
                >
                  <FcApproval fontSize={'23px'} />
                </IconButton>
              </HtmlTooltip>
            ) : (
              <HtmlTooltip title={'Set Default'}>
                <IconButton
                  aria-label={'Default'}
                  size="small"
                  onClick={() => {
                    handleUpdate({
                      ids: [row.original?._id],
                      default: !row.original?.default
                    });
                  }}
                >
                  <HiBadgeCheck fontSize={'23px'} />
                </IconButton>
              </HtmlTooltip>
            ))}
          {permissions?.product?.isUpdate && (
            <HtmlTooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setDeleteRecord(row.original);
                  setShowDeleteConfirmBox(true);
                  closeActions();
                }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
      )
    });
    setColumns([...columns]);
  };

  const fetchData = async () => {
    try {
      const services = await axiosInstance().get(`${routes.product.path}/${id}/service-master`);
      const consumables = await axiosInstance().get(`${routes.product.path}/${id}/service-master/consumables`);
      const serviceData = services?.data?.data;
      const consumableData = consumables?.data?.data;
      setOrignalData([...serviceData]);
      serviceData?.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = parent?.serviceName;
        parent.description = parent?.serviceDescription;
        parent.type = 'Service';
        parent.qty = 1;
        parent.preWork = parent?.preWork ? 'Yes' : 'No';
        parent.subRows = consumableData
          ?.filter((c) => c?.uniqueId === parent?._id)
          ?.map((c, idx) => {
            const stepData = parent?.steps?.find((s) => s?._id === c?.stepId);
            c.stepName = stepData?.stepName;
            c.order = i + 1 + '.' + `${idx + 1}`;
            c.detail = c?.productDetail?.productName;
            c.description = c?.productDetail?.productDescription;
            c.type = 'Product';
            return c;
          });
      });
      setDataRows([...serviceData]);
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  const handleDelete = async () => {
    try {
      let serviceIds = [];
      let productIds = [];
      if (deleteRecord) {
        if (deleteRecord.type === 'Product') {
          productIds.push(deleteRecord._id);
        } else {
          serviceIds.push(deleteRecord._id);
        }
        setDeleteRecord(null);
      } else {
        selectedRecords.map((d) => {
          if (d.type !== 'Product') {
            serviceIds.push(d._id);
          } else {
            productIds.push(d._id);
          }
        });
      }
      setDeleting(true);
      closeActions();
      if (serviceIds.length > 0) {
        await axiosInstance().put(`${routes.product.path}/${id}/service-master/remove`, { ids: serviceIds });
      }
      if (productIds.length > 0) {
        await axiosInstance().put(`${routes.product.path}/${id}/service-master/remove-consumables`, { ids: productIds });
      }
      fetchData();
      setShowDeleteConfirmBox(false);
      setDeleteRecord(null);
      setDeleting(false);
    } catch (e) {
      setDeleting(false);
      toastConfig.setToastConfig(e);
    }
  };

  const handleUpdate = (data: any) => {
    axiosInstance()
      .put(`${routes.product.path}/${id}/service-master/update-default`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: string[]) => {
    setIsAssigning(true);
    rows?.forEach((e: any) => {
      delete e.preWork;
      delete e.name;
    });
    axiosInstance()
      .put(`${routes.product.path}/${id}/service-master/update-order`, {
        data: rows || []
      })
      .then(() => {
        fetchData();
        setIsAssigning(false);
        setOpenAddDialog(false);
        setArrangeView(false);
      })
      .catch((err) => {
        setIsAssigning(false);
        setArrangeView(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (ids: string[]) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${routes.product.path}/${id}/service-master`, {
        service: ids
      })
      .then(() => {
        fetchData();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleAssignConsumable = (data: any) => {
    axiosInstance()
      .post(`${routes.product.path}/${id}/service-master/consumables`, data)
      .then(({ data }) => {
        setAssignProductDialog({ open: false, products: null, service: null, uniqueId: null, steps: null });
        setAssignStepsToConsumablesDialog({ open: false, consumables: null, service: null, steps: null });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setAssignProductDialog({ open: false, products: null, service: null, uniqueId: null, steps: null });
        setAssignStepsToConsumablesDialog({ open: false, consumables: null, service: null, steps: null });
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = (data: any) => {
    axiosInstance()
      .put(`${routes.product.path}/${id}/service-master/consumables`, data)
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    if (updatedData.type === 'Product') {
      const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
      if (rowData && parseInt(inputField['qty'])) {
        handleSaveData({ _id: rowData._id, qty: parseInt(inputField['qty']) });
      }
    }
  };

  return (
    <Fragment>
      {permissions?.product?.isUpdate && (
        <Box display="flex" justifyContent="space-between" p={1} pt={2} pb={2}>
          <Button variant="contained" color="primary" size="small" onClick={() => setOpenAddDialog(true)}>
            Add Services
          </Button>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box ml={1} />
            {dataRows?.length ? (
              <Button variant="outlined" color="primary" size="small" onClick={() => setArrangeView(true)}>
                <GrDrag fontSize="small" color="primary" className="mr-1" />
                Arrange
              </Button>
            ) : null}
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="default"
              size="small"
              onClick={openActions}
              disabled={selectedRecords.length ? false : true}
              aria-controls="action-menu"
              style={{ marginLeft: '0.6rem' }}
              endIcon={<ExpandMore />}
            >
              {isMobile && !isTablet ? '' : 'Actions'}
            </Button>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowDeleteConfirmBox(true)}>
                Delete
              </MenuItem>
              <MenuItem
                disabled={selectedRecords?.filter((p) => p.type === 'Service')?.length > 0 ? false : true}
                onClick={() => {
                  handleUpdate({
                    ids: selectedRecords?.filter((p) => p.type === 'Service')?.map((d) => d._id),
                    default: true
                  });
                  closeActions();
                }}
              >
                Set Default
              </MenuItem>
              <MenuItem
                disabled={selectedRecords?.filter((p) => p.type === 'Service')?.length > 0 ? false : true}
                onClick={() => {
                  handleUpdate({
                    ids: selectedRecords?.filter((p) => p.type === 'Service')?.map((d) => d._id),
                    default: false
                  });
                  closeActions();
                }}
              >
                Remove Default
              </MenuItem>
            </Menu>

            <Box ml={1} />
            <Box display="flex" style={{ marginLeft: 'auto' }}>
              <ImportExportMenu
                permissions={permissions?.packages}
                module="packages-products"
                api={`${product.api}/unknown/service-master`}
                afterImportCompleted={() => {
                  fetchData();
                }}
                isExportAllOrSomeFeature={true}
                ids={[]}
                additionalParams={`productId=${id}`}
              />
            </Box>
          </div>
        </Box>
      )}
      {columns && dataRows ? (
        <CustomReactTable
          height={'calc(100vh - 345px)'}
          columns={columns}
          data={dataRows}
          setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
          onSelect={setSelectedRecords}
          childrenProperty="subRows"
          uniqueKey="_id"
          onSaveEdit={onSaveInlineEdit}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete this ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={isDeleting}
        />
      )}
      {openAddDialog && (
        <AddServiceMaster
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          renderedFrom={`${renderedFrom}_sub-grid-1`}
          close={() => setOpenAddDialog(false)}
          exisitingIds={[]}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            orignalData?.map((d) => {
              return { _id: d?._id, name: d?.serviceName, order: d?.order, preWork: d?.preWork };
            }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={isAssigning}
        />
      )}
      {assignProductDialog.open && (
        <AssignProductDialog
          productsDialogOpen={assignProductDialog.open}
          productId={id}
          handleCloseDialog={() => setAssignProductDialog({ open: false, products: null, service: null, uniqueId: null, steps: null })}
          //assignedProducts={assignProductDialog.products}
          assignedProducts={[]}
          reference={'productService'}
          onSuccess={(d: any) => {
            setAssignStepsToConsumablesDialog({ open: true, consumables: d, service: assignProductDialog.service, steps: assignProductDialog.steps });
            // const data = d?.map((d) => {
            //   return {
            //     product: d?.id,
            //     qty: Number(d.qty),
            //     service: assignProductDialog.service,
            //     uniqueId: assignProductDialog.uniqueId
            //   };
            // });
            // handleAssignConsumable(data);
          }}
          serialized={false}
        />
      )}
      {assignStepsToConsumablesDialog.open && (
        <AssignStepDialog
          handleCloseDialog={() => {
            setAssignProductDialog({ open: false, products: null, service: null, uniqueId: null, steps: null });
            setAssignStepsToConsumablesDialog({ open: false, consumables: null, service: null, steps: null });
          }}
          consumables={assignStepsToConsumablesDialog.consumables}
          steps={assignStepsToConsumablesDialog.steps}
          loading={isAssigning}
          onSuccess={(d: any) => {
            const data = d?.map((d) => {
              return {
                product: d?.id,
                stepId: d?.stepId,
                qty: Number(d.qty),
                service: assignProductDialog.service,
                uniqueId: assignProductDialog.uniqueId
              };
            });
            handleAssignConsumable(data);
          }}
        />
      )}
    </Fragment>
  );
};

export default ServiceMaster;
