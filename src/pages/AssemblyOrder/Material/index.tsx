import { Box, IconButton, MenuItem } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, SERIALIZED_PACKAGES_STATUS, sidebarResource, WORK_ORDER_TYPE } from '../../../constants/helpers';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import MaterialQtyDialog from 'src/pages/AssemblyOrder/Material/MaterialQtyDialog';
import AssignSerializedPackagesDialog from 'src/components/AssignRolesDialog/AssignSerializedPackagesDialog';

const Material = ({ assemblyOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, fetchAssembleOrderData }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const {
    state: { resources, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);
  const [material, setMaterial] = useState([]);
  const [addDialog, setAddDialog] = useState({ open: false, parentId: null });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [openSerializedPackagesDialog, setOpenSerializedPackagesDialog] = useState(false);
  const [childPackageWithoutParentDialog, setChildPackageWithoutParentDialog] = useState({ open: false, data: null });
  const { generateColumns, getMaterialLabel } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', allowedToEdit);
    var data = response;
    setAllFields(JSON.parse(JSON.stringify(data)));
    let newColumns = generateColumns(renderedFrom, data, null, false, assemblyOrderData?.currency || 'USD');

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
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${getMaterialLabel(row.original?.type)}`}</h5> : <NoDataCell />),
        accessorFn: (original) => {
          return getMaterialLabel(original?.type);
        }
      },
      {
        accessor: 'detail',
        Header: 'Details',
        disabled: true,
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {allowedToEdit && ![MATERIAL_TYPE.serializedPackage]?.includes(row?.original?.type) ? (
              <h5
                onClick={() => {
                  setMaterialEdit({ open: true, data: row?.original });
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </h5>
            ) : (
              <h5 className="text-truncate">{row.original?.detail}</h5>
            )}
            {allowedToEdit && row.original.type === MATERIAL_TYPE.package && (
              <>
                {row.original?.subRows?.length > 0 && (
                  <Box>
                    <span>({row.original?.subRows?.length})</span>
                  </Box>
                )}
                {!row?.original?.workOrder && (
                  <Box>
                    <HtmlTooltip title={`Add Existing ${resources?.packages?.titlePlural}`}>
                      <IconButton
                        onClick={() => {
                          setAddDialog({ open: true, parentId: row.original?._id });
                        }}
                        size="small"
                      >
                        <Add fontSize="small" color="primary" />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                )}
              </>
            )}
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  if (row?.original?.type === MATERIAL_TYPE.serializedPackage) {
                    window.open(`${routes.serializedPackagesDetail.path}/${row.original.serializedPackageId}`);
                  } else {
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
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row, table }) => (
        <>
          {row?.original?.type != MATERIAL_TYPE.serializedPackage && (
            <>
              <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
                <IconButton
                  size="small"
                  aria-label="Details"
                  disabled={allowedToEdit ? false : true}
                  onClick={() => {
                    setMaterialEdit({ open: true, data: row?.original });
                  }}
                >
                  <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
                </IconButton>
              </HtmlTooltip>
              <HtmlTooltip title={row.original?.canDelete ? 'Delete' : 'Work Order is already assigned'}>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setDeleteData([row.original._id]);
                  }}
                  disabled={row.original?.canDelete ? false : true}
                >
                  <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
                </IconButton>
              </HtmlTooltip>
            </>
          )}
        </>
      )
    });
    setColumns(coloum);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    const {
      data: { data, count }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/material/${assemblyOrderData._id}`);

    setMaterial(JSON.parse(JSON.stringify(data.material)));
    let rows = data?.material?.filter((e) => e.parentId === null);
    const serializedPackages = data?.serializedPackages || [];

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.packageDetail?.packageName || '';
      parent.description = parent?.packageDetail?.packageDescription || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.canDelete = parent?.workOrder ? false : true;
      parent.subRows = generateNestedData(data.material, serializedPackages, parent);
      if (parent.subRows?.find((r) => !r?.canDelete)) {
        parent.canDelete = false;
      }
    });

    if (rows.length !== 0) {
      if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    } else {
      setNextStep(false);
    }
    dispatch({ type: 'initialize', data: rows, count: count });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, serializedPackages, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : '';
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageDescription
            : '';
      _subRow.qty = _subRow.qty;
      _subRow.canDelete = _subRow?.workOrder ? false : true;
      _subRow.subRows = generateNestedData(material, serializedPackages, _subRow);
    });

    const serializedPackae = serializedPackages?.filter((p) => p?.uniqueId === parent?._id);
    serializedPackae?.forEach((_p, i) => {
      _p.index = parent.index + '.' + `${i + 1}`;
      _p.detail = _p?.serializedPackage?.optionLabel;
      _p.serializedPackageId = _p?.serializedPackage?.optionValue;
    });

    return [...subRows, ...serializedPackae];
  };

  const handleAdd = async (rows, onlyAddChildren = false) => {
    setSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = d?.type || MATERIAL_TYPE.package;
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog.parentId;
      if (allFields?.some((f) => f?.fieldName === 'warehouse')) {
        element.warehouse = assemblyOrderData?.warehouse?.optionValue;
      }
      if (allFields?.some((f) => f?.fieldName === 'workOrderType')) {
        element.workOrderType = WORK_ORDER_TYPE.assemblyOrder;
      }
      if (element.type === MATERIAL_TYPE.package && onlyAddChildren) {
        element.onlyAddChildren = true;
      }
      material.push(element);
    });

    axiosInstance()
      .post(`${routes.assemblyOrder.path}/material/${assemblyOrderData._id}`, { material })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setChildPackageWithoutParentDialog({ open: false, data: null });
        setAddDialog({ open: false, parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchAssembleOrderData();
        fetchData();
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        setChildPackageWithoutParentDialog({ open: false, data: null });
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.assemblyOrder.path}/material/${assemblyOrderData?._id}/delete`, { ids: rows })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setDeleting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchAssembleOrderData();
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, assemblyOrderData?.currency || 'USD');
    handleSaveData(rows);
  };

  const handleSaveData = async (rows: any) => {
    setUpdating(true);
    const data = [];
    rows?.forEach((element) => {
      data.push({
        ...element,
        ...(allFields?.some((f) => f?.fieldName === 'warehouse')
          ? { warehouse: element?.warehouse ? element?.warehouse : assemblyOrderData?.warehouse?.optionValue }
          : {})
      });
    });
    axiosInstance()
      .put(`${routes.assemblyOrder.path}/material/${assemblyOrderData._id}`, { material: data })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setUpdating(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setMaterialEdit({ open: false, data: null });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddDialog({ open: true, parentId: null });
          }}
        >
          {`Add Existing ${resources?.packages?.titlePlural}`}
        </MenuItem>
      </>
    );
  };

  const handleAssignSerializedPackage = (serializedPackages) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${routes.assemblyOrder.path}/material/${assemblyOrderData._id}/serialized-packages`, serializedPackages)
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setOpenSerializedPackagesDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const checkUniqueWarehouse = (records = []) => {
    if (!allFields?.find((f) => f?.fieldName === 'warehouse')) {
      return true;
    }
    if (!records?.length) {
      return true;
    }
    if (
      records?.every(
        (r) => [WORK_ORDER_TYPE.disassemblyOrder]?.includes(r?.workOrderType) && r?.warehouse?.optionValue === records[0]?.warehouse?.optionValue
      )
    ) {
      return false;
    }
    return true;
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {permissions?.serializedPackages?.isRead &&
          selectedRecords?.filter((e) => e?.workOrderType === WORK_ORDER_TYPE.disassemblyOrder)?.length > 0 && (
            <MenuItem
              disabled={checkUniqueWarehouse(selectedRecords?.filter((e) => e?.type === MATERIAL_TYPE.package))}
              onClick={() => {
                setOpenSerializedPackagesDialog(true);
              }}
            >{`Assign ${resources?.serializedPackages?.titleSingular}`}</MenuItem>
          )}
        <MenuItem
          disabled={selectedRecords?.every((e) => !e.hideSelection && e.canDelete) ? false : true}
          onClick={() => {
            const dataToDelete = selectedRecords?.filter((e) => !e.hideSelection && e.canDelete).map((rec: any) => rec._id);
            setDeleteData(dataToDelete);
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
          isAddButtonVisible={true}
          addButtonMenuItems={addButtonMenuItems()}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
          hasXpadding
        />
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            onSaveEdit={onSaveInlineEdit}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            isClientSideGrid={true}
            resource={sidebarResource.assemblyOrder}
            expander={true}
            arrangeRowField={{ key: 'material', _id: assemblyOrderData?._id, materialKey: '_id' }}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {addDialog.open && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, parentId: null })}
          onSuccess={(rows) => {
            if (rows?.find((e) => e?.packages?.length)) {
              setChildPackageWithoutParentDialog({ open: true, data: rows });
            } else {
              handleAdd(rows);
            }
          }}
          isSubmitting={isSubmitting}
          packageType={'product'}
          forceSplitQuantity={true}
        />
      )}
      {materialEdit.open && (
        <MaterialQtyDialog
          onClose={() => {
            setMaterialEdit({ open: false, data: null });
          }}
          rowData={materialEdit.data}
          assemblyOrderData={assemblyOrderData}
          handleSaveData={handleSaveData}
          loading={isUpdating}
          isBulkedit={false}
          material={material}
        />
      )}
      {openSerializedPackagesDialog && (
        <AssignSerializedPackagesDialog
          onSuccess={handleAssignSerializedPackage}
          handleClose={() => {
            setOpenSerializedPackagesDialog(false);
          }}
          extraFilterById={[{ field: 'warehouse', term: { $in: [assemblyOrderData?.warehouse?.optionValue] } }]}
          extraDeepFilter={[{ field: 'status', term: [SERIALIZED_PACKAGES_STATUS.available, SERIALIZED_PACKAGES_STATUS.underReview] }]}
          isSubmitting={isSubmitting}
          ids={dataRows?.map((d) => d?.serializedPackageId)}
          selectedPackages={selectedRecords
            ?.filter((r) => [WORK_ORDER_TYPE.disassemblyOrder]?.includes(r?.workOrderType))
            ?.map((r) => ({
              uniqueId: r?._id,
              package: r?.packageDetail?._id,
              packageName: r?.packageDetail?.packageName,
              qty: r?.qty,
              warehouse: r?.warehouse?.optionValue || assemblyOrderData?.warehouse?.optionValue
            }))}
        />
      )}
      {childPackageWithoutParentDialog.open && (
        <ConfirmationDialog
          open={true}
          message={`Would you like to add only the child ${resources?.packages?.titlePlural} ?`}
          onOk={() => {
            handleAdd(childPackageWithoutParentDialog.data, true);
          }}
          onClose={() => {
            handleAdd(childPackageWithoutParentDialog.data);
          }}
          forwardText="Yes"
          cancelText="No"
          okBtnLoading={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default Material;
