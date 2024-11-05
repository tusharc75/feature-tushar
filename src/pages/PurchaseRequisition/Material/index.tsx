import { Box, Button, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase, map, startCase, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CHILD_RESOURCE, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import MaterialDialog from './materialDialog';
import CostDialog from './CostDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import RequestButton from 'src/pages/DoaSetupNew/RequestButton';
import { rentalManagementMessage } from 'src/constants/messageHelpers';
import { FiExternalLink } from 'react-icons/fi';

const Material = ({
  allowedToEdit,
  allowedToAddMaterial,
  purchaseRequisitionData,
  fetchpurchaseRequisitionData,
  updateDOASetup = null,
  currentStep,
  DOAData = null,
  fetchParentData = null,
  setNextStep,
  setPrevStep,
  setNextStepToolTip
}) => {
  const renderedFrom = `${camelCase(routes?.purchaseRequisition.title)}_Material`;

  const toastConfig = useContext(CustomToastContext);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [showCostDialog, setShowCostDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);

  const [isSubmitting, setSubmitting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [allFields]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(
      CHILD_RESOURCE.purchaseRequisitionDetail,
      purchaseRequisitionData?.currency,
      allowedToEdit && allowedToAddMaterial
    );
    const newColumns = generateColumns(renderedFrom, data, null, false, purchaseRequisitionData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
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
        width: 100,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
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
            {allowedToEdit && allowedToAddMaterial ? (
              <p
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
              </p>
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}
            {![MATERIAL_TYPE.manualEntry]?.includes(row.original.type) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
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
          <IconButton
            size="small"
            aria-label="Details"
            disabled={!allowedToEdit}
            onClick={() => {
              onMaterialEdit(row.original, table.getRowModel().rows);
            }}
          >
            <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
          </IconButton>
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
    setColumns(coloum);
    setAllFields(data);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    if (currentStep === 'DOA') {
      setNextStep(false);
      setPrevStep(false);
    }
    var data: any = [];
    var nextStepMessage = null;
    const response = await axiosInstance().get(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData._id}`);
    data = response?.data?.data;

    let costData: any = await axiosInstance().get(`${routes.purchaseRequisition.path}/cost/${purchaseRequisitionData._id}`);
    costData = costData?.data?.data || [];
    costData?.forEach((e) => {
      e.type = MATERIAL_TYPE.manualEntry;
    });

    const isPriceRequired = allFields?.filter((el) => el.fieldName === 'price' && el.required).length > 0;

    let rows = data.material.filter((e) => e.parentId === null);
    rows = [...rows, ...costData];
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
            : parent.detail || parent.description;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceDescription
            : parent.description;
      parent.isValid = parent['finalPrice_' + purchaseRequisitionData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      if (!parent.isValid) {
        nextStepMessage = rentalManagementMessage.validPrice;
      }
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
      setNextStepToolTip(nextStepMessage || rentalManagementMessage.addProductPackage);
    } else {
      setNextStep(true);
      setNextStepToolTip(null);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
    if (updateDOASetup) {
      updateDOASetup(data?.doaSetup);
    }
  };

  const onMaterialEdit = (row, rows) => {
    if (row.type === MATERIAL_TYPE.manualEntry) {
      setShowCostDialog({
        open: true,
        data: row,
        showSaveAndNext: row?.index < rows?.length ? true : false
      });
    } else {
      setMaterialEdit({
        open: true,
        data: row,
        bulkedit: false,
        showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
      });
    }
  };

  const handleAddCost = (rows) => {
    setLoadingEdit(true);
    axiosInstance()
      .post(`${routes.purchaseRequisition.path}/cost/${purchaseRequisitionData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        setLoadingEdit(false);
      })
      .catch((error) => {
        setLoadingEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows, saveAndNext = false) => {
    setLoadingEdit(true);
    axiosInstance()
      .put(`${routes.purchaseRequisition.path}/cost/${purchaseRequisitionData._id}/update`, { additionalCost: rows })
      .then(() => {
        fetchData();
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < dataRows?.length - 1) {
            if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
              setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
            }
          }
        } else {
          setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        }
        setLoadingEdit(false);
      })
      .catch((error) => {
        setLoadingEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${routes?.purchaseRequisition?.path}/material/${purchaseRequisitionData._id}`, { material })
      .then(({ data }) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        fetchpurchaseRequisitionData();
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        fetchpurchaseRequisitionData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
            if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
              setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
              setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setMaterialEdit({
                open: true,
                data: dataRows[rowIndex + 1],
                bulkedit: false,
                showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
              });
            }
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
    const cost = rows?.filter((ele) => ele.type === MATERIAL_TYPE.manualEntry).map((e) => e?.id);
    const products = rows?.filter((ele) => ele.type !== MATERIAL_TYPE.manualEntry);
    if (products?.length) {
      axiosInstance()
        .put(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData?._id}/delete`, { ids: rows })
        .then(({ data }) => {
          setDeleting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
          fetchpurchaseRequisitionData();
          setDeleteData(null);
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
    if (cost?.length) {
      axiosInstance()
        .post(`${routes.purchaseRequisition.path}/cost/${purchaseRequisitionData._id}/delete`, { ids: cost })
        .then(({ data }) => {
          setDeleting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
          fetchpurchaseRequisitionData();
          setDeleteData(null);
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, purchaseRequisitionData?.currency);
    handleSaveData(rows);
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
        <MenuItem
          onClick={() => {
            setAddDialog({ open: true, type: 'service', parentId: null });
          }}
        >
          Add Existing Services
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
          }}
        >
          Add Manual Entry
        </MenuItem>
      </>
    );
  };

  const previewDownloadProps = {
    fileName: `${routes.purchaseRequisition.title}-${purchaseRequisitionData?.purchaseRequisitionNumber}`,
    resource: sidebarResource.purchaseRequisition,
    referenceId: purchaseRequisitionData?._id,
    columns: columns
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
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

  const rightSideContents = () => {
    return (
      <>
        {!DOAData && currentStep === 'DOA' && (
          <RequestButton
            resource={sidebarResource.purchaseRequisition}
            id={purchaseRequisitionData._id}
            entity={purchaseRequisitionData.entity}
            processStatus={currentStep}
            fetchParentData={fetchParentData}
          />
        )}
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <DetailsPageHeader
          isAddButtonVisible={allowedToAddMaterial}
          addButtonMenuItems={addButtonMenuItems()}
          isActionButtonVisible={allowedToAddMaterial}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
          previewDownloadProps={previewDownloadProps}
          hasXpadding={true}
          rightSideContents={rightSideContents()}
        />
      )}
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideSelection={allowedToEdit && allowedToAddMaterial ? false : true}
            hideAction={allowedToEdit && allowedToAddMaterial ? false : true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
            expander={true}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
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
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
          purchaseRequisitionData={purchaseRequisitionData}
        />
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(d) => {
            handleAdd(d);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === 'service' && (
        <AssignServiceDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {showCostDialog.open && (
        <CostDialog
          onClose={() => {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          purchaseRequisitionData={purchaseRequisitionData}
          costData={!isBulkEdit ? showCostDialog.data : selectedRecords?.filter((e) => !e.hideSelection)}
          bulkEdit={isBulkEdit}
          showSaveAndNext={showCostDialog.showSaveAndNext}
          loadingEdit={loadingEdit}
        />
      )}
    </Fragment>
  );
};

export default Material;
