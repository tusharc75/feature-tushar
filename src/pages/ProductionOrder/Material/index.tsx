import { Box, IconButton, MenuItem } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import CreateProduct from 'src/components/Product/CreateProduct';
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
import { CHILD_RESOURCE, MATERIAL_TYPE, PRODUCTION_ORDER_STATUS, asyncForEach, productionOrder, sidebarResource } from '../../../constants/helpers';
import MaterialDialog from './MaterialDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Material = ({ productionOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, allowedToDelete, updateOrderStatus }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, filters, sorting, selectedRecords, search } = state;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.productionOrderDetail, productionOrderData?.currency, allowedToEdit);
    var data = response?.filter((e) => !['detail', 'description']?.includes(e?.fieldName));
    setAllFields(JSON.parse(JSON.stringify(data)));
    let newColumns = generateColumns(renderedFrom, data, null, false, productionOrderData?.currency || 'USD');
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
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
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
            {allowedToEdit ? (
              <h5
                onClick={() => {
                  setMaterialEdit({
                    open: true,
                    data: row.original,
                    bulkedit: false,
                    showSaveAndNext:
                      row?.index < table.getRowModel().rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
                  });
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
                <Box ml={1}>
                  <span>({row.original?.subRows?.length})</span>
                </Box>
                <Box ml={1}>
                  <HtmlTooltip title="Add Existing Products">
                    <IconButton
                      onClick={() => {
                        setAddDialog({ open: true, type: MATERIAL_TYPE.product, parentId: row.original?._id });
                      }}
                      size="small"
                    >
                      <Add fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
              </>
            )}
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
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
          <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
            <IconButton
              size="small"
              aria-label="Details"
              disabled={allowedToEdit ? false : true}
              onClick={() => {
                onMaterialEdit(row, table.getRowModel().rows);
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
                const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                setDeleteData(obj);
              }}
              disabled={row.original?.canDelete ? false : true}
            >
              <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
        </>
      )
    });
    setColumns(coloum);
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    setNextStep(false);
    const queryString = getQueryString();
    const {
      data: { data, count }
    } = await axiosInstance().get(`${productionOrder.api}/material/${productionOrderData._id}${queryString}`);
    let rows = data?.material?.filter((e) => e.parentId === null);
    const totalPrev = page * limit;
    rows.forEach((parent, i) => {
      parent.index = i + 1 + totalPrev;
      parent.detail = parent?.detail
        ? parent?.detail
        : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.packageDetail?.packageName;
      parent.description = parent?.description
        ? parent?.description
        : parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent?.packageDetail?.packageDescription;
      parent.qty = parent.qty;
      parent.canDelete = parent?.workOrder ? false : true;
      if (parent?.workOrder) {
        parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      }
      parent.subRows = generateNestedData(data.material, parent);
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

  const onMaterialEdit = (row, rows) => {
    setMaterialEdit({
      open: true,
      data: row.original,
      bulkedit: false,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = _subRow?.detail
        ? _subRow?.detail
        : _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.packageDetail?.packageName;
      _subRow.description = _subRow?.description
        ? _subRow?.description
        : _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow?.packageDetail?.packageDescription;
      _subRow.qty = _subRow.qty;
      _subRow.canDelete = _subRow?.workOrder ? false : true;
      if (_subRow?.workOrder) {
        _subRow.workOrderNumber = _subRow?.workOrder?.workOrderNumber;
      }
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const material: any = [];
    await asyncForEach(rows, async (d) => {
      const qty = d.qty ? parseFloat(d.qty) : 1;
      await asyncForEach(Array.from(Array(qty).keys()), async (i: any) => {
        const element: any = {};
        element.materialId = d._id;
        element.type = d?.type || addDialog.type;
        element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
        element.qty = 1;
        element.parentId = addDialog.parentId;
        material.push(element);
      });
    });
    axiosInstance()
      .post(`${productionOrder.api}/material/${productionOrderData._id}`, { material })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
        if (productionOrderData?.status === PRODUCTION_ORDER_STATUS.new) {
          updateOrderStatus(PRODUCTION_ORDER_STATUS.inProgress);
        }
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${productionOrder.api}/material/${productionOrderData?._id}/delete`, { ids: rows })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setDeleting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
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
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, productionOrderData?.currency);
    handleSaveData(rows);
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${productionOrder.api}/material/${productionOrderData._id}`, { material: rows })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setUpdating(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          setMaterialEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
        }
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
            setAddDialog({ open: true, type: MATERIAL_TYPE.product, parentId: null });
          }}
        >
          Add Existing Products
        </MenuItem>
        {permissions?.product?.isCreate && (
          <MenuItem
            onClick={() => {
              setAddDialog({ open: true, type: 'newProduct', parentId: null });
            }}
          >
            Add New Product
          </MenuItem>
        )}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setMaterialEdit({ open: true, data: selectedRecords?.filter((e) => !e.hideSelection), bulkedit: true, showSaveAndNext: false });
          }}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.every((e) => !e.hideSelection && e.canDelete) ? false : true}
          onClick={() => {
            const dataToDelete = selectedRecords
              ?.filter((e) => !e.hideSelection && e.canDelete)
              .map((rec: any) => {
                const obj: any = {};
                obj.id = rec._id;
                obj.type = rec?.type;
                obj.materialId = rec?.materialId;
                return obj;
              });
            setDeleteData(dataToDelete);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        <AsynImportExportMenu
          resource={sidebarResource.productionOrder}
          subResource={`material`}
          referenceId={productionOrderData._id}
          permissions={permissions?.productionOrder}
          module={resources?.productionOrder?.titleSingular}
          api={`${productionOrder.api}/material/${productionOrderData._id}`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportCount={true}
          exportCount={selectedRecords.length}
          ids={selectedRecords?.length ? selectedRecords?.map((obj) => obj._id) : []}
        />
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
            rightSideContents={rightSideContents()}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <>
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
            />
          </Box>
        </>
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
      {addDialog.open && addDialog.type === MATERIAL_TYPE.product && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(d) => {
            handleAdd(d);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === 'newProduct' && (
        <CreateProduct
          handleClose={() => {
            setAddDialog({ open: false, type: '', parentId: null });
          }}
          onSuccess={(d) => {
            handleAdd([
              {
                ...d,
                unitMain: d?.unit,
                type: MATERIAL_TYPE.product
              }
            ]);
          }}
          isRedirectToDetailPage={false}
          openFrom="productMaster"
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.package && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
          packageType={'product'}
        />
      )}
      {materialEdit.open && (
        <MaterialDialog
          onClose={() => {
            setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
          }}
          materialData={materialEdit.data}
          productionOrderData={productionOrderData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
    </Fragment>
  );
};

export default Material;
