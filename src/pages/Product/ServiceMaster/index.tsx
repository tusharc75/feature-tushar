import { Box, IconButton, MenuItem } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FcApproval } from 'react-icons/fc';
import { GrDrag } from 'react-icons/gr';
import { HiBadgeCheck } from 'react-icons/hi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import { product, serviceMaster } from 'src/constants/helpers';
import AssignStepDialog from './AssignStepDialog/Index';
import FrequencyDialog from './FrequencyDialog';
import { FiExternalLink } from 'react-icons/fi';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import ServiceCondition from 'src/pages/Product/ServiceMaster/ServiceCondition';
import { ThemeButton } from 'src/components/Helpers/Buttons';

interface Props {
  renderedFrom: string;
  id: string;
}

const ServiceMaster = (props: Props) => {
  const { renderedFrom, id } = props;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [orignalData, setOrignalData] = useState([]);
  const [frequencyDialog, setFrequencyDialog] = useState({ open: false, data: null });
  const [tabValue, setTabValue] = useState(0);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

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
        width: 100,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.order || <NoDataCell />}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        disableFilters: true,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
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
        width: 200,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) =>
          row?.original?.detail ? (
            <div className="flex items-center gap-2">
              <p className="text-truncate">{row.original.detail}</p>
              <IconButton
                size="small"
                onClick={() => {
                  if (row?.original?.type === 'Product') {
                    window.open(`${routes.productDetail.path}/${row.original?.product}`);
                  } else {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original?.serviceId}`);
                  }
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
      ...(serviceColumns && serviceColumns?.some((column) => column?.fieldData?.fieldName === 'frequency')
        ? [
          {
            accessor: 'frequency',
            Header: 'Frequency',
            width: 150,
            minWidth: 150,
            Cell: ({ row }) => (row.original?.frequency ? <p>{row.original?.frequency}</p> : <NoDataCell />)
          }
        ]
        : []),
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
        width: 100,
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
      Header: 'Actions',
      width: 150,
      minWidth: 150,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }: any) => (
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          {permissions?.product?.isUpdate &&
            row?.original?.type === 'Service' &&
            serviceColumns &&
            serviceColumns?.some((column) => column?.fieldData?.fieldName === 'frequency') && (
              <HtmlTooltip title="Edit Frequency">
                <IconButton
                  size="small"
                  aria-label="Edit"
                  onClick={() => {
                    setFrequencyDialog({ open: true, data: row?.original });
                  }}
                >
                  <EditIcon fontSize="small" color="primary" />
                </IconButton>
              </HtmlTooltip>
            )}
          {permissions?.product?.isUpdate && row?.original?.type === 'Service' && (
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
            row?.original?.type === 'Service' &&
            (row?.original?.default ? (
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
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
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
      dispatch({ type: 'initialize', data: serviceData, count: serviceData?.length });
      dispatch({ type: 'loading', loading: false });
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
    if (updatedData.type === 'Service') {
      toastConfig.setToastConfig({
        open: true,
        type: 'warning',
        message: 'The default service quantity is set to 1 and cannot be changed.'
      });
    } else if (updatedData.type === 'Product') {
      const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
      if (rowData && parseInt(inputField['qty'])) {
        handleSaveData({ _id: rowData._id, qty: parseInt(inputField['qty']) });
      }
    }
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setOpenAddDialog(true)}>Add Services</MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
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
          }}
        >
          Remove Default
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        {dataRows?.length ? (
          <ThemeButton
            startIcon={<GrDrag fontSize="small" />}
            onClick={() => setArrangeView(true)}>
            Arrange
          </ThemeButton>
        ) : null}
        <ImportExportMenu
          permissions={permissions?.packages}
          module="products"
          api={`${product.api}/unknown/service-master`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          ids={[]}
          additionalParams={`productId=${id}`}
        />
      </>
    );
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  return (
    <Fragment>
      <CustomTabs value={tabValue} onChange={handleMainTabChange}>
        <CustomTab value={0} label={'Normal'} primaryColor={true} />
        <CustomTab value={1} label={'Conditional'} primaryColor={true} />
      </CustomTabs>
      <TabPanel value={tabValue} index={0}>
        {permissions?.product?.isUpdate && (
          <>
            <DetailsPageHeader
              isAddButtonVisible={true}
              addButtonMenuItems={addButtonMenuItems()}
              isActionButtonVisible={true}
              actionButtonMenuItems={actionButtonMenuItems()}
              actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
              rightSideContents={rightSideContents()}
              hasXpadding={false}
            />
          </>
        )}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 345px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            onSaveEdit={onSaveInlineEdit}
            expander={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ServiceCondition renderedFrom={renderedFrom} id={id} />
      </TabPanel>
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
        <AssignServiceDialog
          onSuccess={(services) => {
            const ids = services?.map((i) => i?._id);
            handleSubmit(ids);
          }}
          handleClose={() => {
            setOpenAddDialog(false);
          }}
          isSubmitting={isSubmitting}
          hideQty={true}
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
          handleCloseDialog={() => setAssignProductDialog({ open: false, products: null, service: null, uniqueId: null, steps: null })}
          onSuccess={(d: any) => {
            setAssignStepsToConsumablesDialog({ open: true, consumables: d, service: assignProductDialog.service, steps: assignProductDialog.steps });
          }}
          serialized={false}
          extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
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
      {frequencyDialog?.open && (
        <FrequencyDialog
          serviceData={frequencyDialog?.data}
          productId={id}
          onClose={() => {
            setFrequencyDialog({ open: false, data: null });
          }}
          onSuccess={() => {
            fetchData();
            setFrequencyDialog({ open: false, data: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default ServiceMaster;
