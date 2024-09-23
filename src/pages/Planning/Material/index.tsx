import { Box, IconButton, MenuItem } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { ASSET_STATUS, CHILD_RESOURCE, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import MaterialDialog from './materialDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Material = ({ renderedFrom, allowedToEdit, planningData, fetchPlanningData, setReserveAssetWarning }) => {
  const {
    state: { user, permissions }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });

  const [columns, setColumns] = useState(null);

  const [allFields, setAllFields] = useState([]);

  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [planningData]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.planningMaterial, planningData?.currency, allowedToEdit);
    setAllFields(data);
    const newColumns = generateColumns(renderedFrom, data, null, false, planningData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 80,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${row.original?.type === MATERIAL_TYPE.serializedAsset ? `Asset` : startCase(row.original?.type)}`}</p>
            <Box pl={1}>
              {row.original['type'] === MATERIAL_TYPE.product
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === MATERIAL_TYPE.package
                  ? row.original?.packageDetail?.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === MATERIAL_TYPE.service
                    ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                    : ''}
            </Box>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {allowedToEdit && row.original.type !== MATERIAL_TYPE.serializedAsset ? (
              <p
                onClick={() => {
                  onMaterialEdit(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}
            {row.original.type === MATERIAL_TYPE.package && allowedToEdit && (
              <>
                <Box>
                  <span>({row.original?.subRows?.length})</span>
                </Box>
                <Box>
                  <HtmlTooltip title="Add Product">
                    <IconButton
                      onClick={() => {
                        setAddDialog({ open: true, type: 'product', parentId: row.original?._id });
                      }}
                      size="small"
                    >
                      <Add fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
              </>
            )}

            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
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
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => (
        <>
          {row?.original?.type !== MATERIAL_TYPE.serializedAsset && <IconButton
            size="small"
            aria-label="Details"
            disabled={!allowedToEdit}
            onClick={() => {
              onMaterialEdit(row, table.getRowModel().rows);
            }}
          >
            <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
          </IconButton>}
          <IconButton
            size="small"
            aria-label="Details"
            disabled={!allowedToEdit}
            onClick={() => {
              const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
              setDeleteData(obj);
            }}
          >
            <DeleteIcon fontSize="small" color={allowedToEdit ? 'error' : 'disabled'} />
          </IconButton>
        </>
      )
    });
    if (!allowedToEdit) {
      coloum?.forEach((e: any) => {
        e.editable = false;
      });
    }
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    const response = await axiosInstance().get(`${routes.planning.path}/material/${planningData._id}`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.package
            ? parent.packageDetail?.packageName
            : parent.serviceDetail?.serviceName;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : parent?.serviceDetail?.serviceDescription;
      parent.qty = parent.qty;
      parent.assetQty = data.material?.filter((i) => i.parentId === parent._id && i.type === MATERIAL_TYPE.serializedAsset)?.length;
      parent.hideSelection = false;
      parent.subRows = generateNestedData(data.material, parent);
    });

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const onMaterialEdit = (row, rows) => {
    let showSaveAndNext;
    if (row.depth != 0) {
      const allRows = rows.filter((ele) => ele.parentId === row.parentId);
      showSaveAndNext = row?.index < allRows.length - 1 ? true : false;
    } else {
      showSaveAndNext = row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false;
    }

    setMaterialEdit({
      open: true,
      data: row.original,
      bulkedit: false,
      showSaveAndNext: showSaveAndNext
    });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow.assetDetail.assetNumber
              : _subRow.serviceDetail?.serviceName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? parent.description
              : _subRow?.serviceDetail?.serviceDescription;
      _subRow.qty = _subRow.qty;
      _subRow.assetQty = material?.filter((i) => i.parentId === _subRow._id && i.type === MATERIAL_TYPE.serializedAsset)?.length;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    for (const _subRow of subRows) {
      let assetStatus = _subRow?.assetDetail?.status;
      if (
        planningData?.type === 'Rental Job' &&
        _subRow.type === MATERIAL_TYPE.serializedAsset &&
        assetStatus !== ASSET_STATUS.new &&
        assetStatus !== ASSET_STATUS.available &&
        assetStatus !== ASSET_STATUS.underReview
      ) {
        setReserveAssetWarning(true);
        break;
      }
    }
    return subRows;
  };

  const handleAdd = async (rows) => {
    setIsAdding(true);
    const material: any = [];
    if (addDialog.type === 'serializedAsset') {
      rows?.forEach((e) => {
        material.push(e);
      });
    } else {
      rows.forEach((d) => {
        const element: any = {};
        element.materialId = d._id;
        element.type = addDialog.type;
        element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
        element.qty = d.qty ? parseFloat(d.qty) : 1;
        element.parentId = addDialog.parentId;
        material.push(element);
      });
    }
    axiosInstance()
      .post(`${routes?.planning?.path}/material/${planningData._id}`, { material })
      .then(({ data }) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        fetchPlanningData();
        setIsAdding(false);
      })
      .catch((error) => {
        setIsAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.planning.path}/material/${planningData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
            setMaterialEdit({
              open: true,
              data: dataRows[rowIndex + 1],
              bulkedit: false,
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          } else {
            const allSubRowData = flattenArray(dataRows).filter((ele) => ele.parentId === row.parentId);
            const subRowIdx = allSubRowData?.findIndex((d) => d._id === row?._id);
            setMaterialEdit({
              open: true,
              data: allSubRowData[subRowIdx + 1],
              bulkedit: false,
              showSaveAndNext: subRowIdx + 1 < allSubRowData?.length - 1 ? true : false
            });
          }
        } else {
          setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
        }
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.planning.path}/material/${planningData?._id}/delete`, { ids: rows })
      .then(({ data }) => {
        setDeleting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        fetchPlanningData();
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
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = selectedRecords.filter((f) => f?.type === MATERIAL_TYPE.product && f?.productDetail?.serializedProduct && f?.qty > f?.assetQty);
    return flatArray.length === 0;
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddDialog({ open: true, type: 'product', parentId: null });
          }}
        >
          Add Existing Products
        </MenuItem>
        {!user?.user?.brandPolicy?.rentalService && planningData?.type === 'Rental Job' ? null : (
          <MenuItem
            onClick={() => {
              setAddDialog({ open: true, type: 'service', parentId: null });
            }}
          >
            Add Existing Services
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setAddDialog({ open: true, type: 'package', parentId: null });
          }}
        >
          Add Existing Packages
        </MenuItem>
      </>
    );
  };

  const previewDownloadProps = {
    fileName: `${routes.planning.title}-${planningData?.planningNumber}`,
    resource: sidebarResource.planning,
    referenceId: planningData._id,
    columns: columns,
    isSendEmail: true
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {planningData.type === 'Rental Job' && (
          <MenuItem
            disabled={disableAssignSerializedAssets()}
            onClick={() => {
              setAssetAssignedProduct(selectedRecords.filter((i) => i?.type === 'product' && i?.productDetail?.serializedProduct));
              setAddDialog({ open: true, type: 'serializedAsset', parentId: null });
            }}
          >
            Assign Serialized Asset
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setMaterialEdit({ open: true, data: selectedRecords?.filter((e) => !e.hideSelection), bulkedit: true, showSaveAndNext: false });
          }}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            const dataToDelete = selectedRecords
              ?.filter((e) => !e.hideSelection)
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

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
        previewDownloadProps={previewDownloadProps}
        leftSideContents
        rightSideContents
        hasXpadding={false}
      />

      {columns && dataRows ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
            expander={true}
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
      {materialEdit.open && (
        <MaterialDialog
          onClose={() => {
            setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
          }}
          materialData={materialEdit.data}
          planningData={planningData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(d) => {
            handleAdd(d);
          }}
          isSubmitting={isAdding}
        />
      )}
      {addDialog.open && addDialog.type === 'service' && (
        <AssignServiceDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isAdding}
        />
      )}
      {addDialog.open && addDialog.type === 'package' && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isAdding}
        />
      )}
      {addDialog.open && addDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference={'planning'}
          referenceData={{
            fromDate: planningData?.startDate,
            toDate: planningData?.endDate
          }}
          handleClose={() => {
            setAddDialog({ open: false, type: '', parentId: null });
            setAssetAssignedProduct([]);
          }}
          ids={flattenArray(dataRows)
            ?.filter((e) => e.type === 'serializedAsset')
            ?.map((e) => e.materialId)}
          handleSucess={(rows) => {
            handleAdd(
              rows?.map((e) => {
                return { materialId: e.asset, type: 'serializedAsset', parentId: e._id };
              })
            );
          }}
          isAssigning={isAdding}
          selectedProducts={assetAssignedProduct?.map((i) => {
            return { _id: i._id, product: i.materialId, productName: i.detail, qty: i.qty - i.assetQty };
          })}
        />
      )}
    </Fragment>
  );
};

export default Material;
