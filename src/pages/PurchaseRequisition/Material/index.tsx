import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { map, startCase, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
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
import { fetch_pr_cost_fields, fetch_pr_product_fields } from 'src/components/PurchaseRequisition/helper';

const Material = ({ renderedFrom, allowedToEdit, purchaseRequisitionData }) => {
  const {
    state: { user, permissions }
  }: any = useData();

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

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_pr_product_fields(purchaseRequisitionData?.currency);
    setAllFields(data);
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {allowedToEdit ? (
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
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        sticky: isMobile || isTablet ? 'none' : 'left',
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
    const response = await axiosInstance().get(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData._id}`);
    const additionalCost = await axiosInstance().get(`${routes.purchaseRequisition.path}/cost/${purchaseRequisitionData._id}`);
    const additionalData = additionalCost?.data?.data || [];
    const updatedAdditionalData = additionalData?.map((e: any) => {
      return { ...e, type: 'Manual Entry'};
    })
    data = response?.data?.data;
    let rows = data.material.filter((e) => e.parentId === null);
    rows = [...rows, ...updatedAdditionalData]
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
              : parent.detail || parent.description
        }`;
      parent.description =
       parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
              : parent.description;
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const onMaterialEdit = (row, rows) => {
    if (row.type != 'Manual Entry' ) {
      setMaterialEdit({
            open: true,
            data: row,
            bulkedit: false,
            showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
          });
        }
    if(row.type === 'Manual Entry')
    {
    setShowCostDialog({ open: true, data: row, showSaveAndNext: row?.index < rows?.length ? true : false });
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
            if (dataRows[rowIndex + 1]?.type === 'Manual Entry') {
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
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
            if (dataRows[rowIndex + 1]?.type === 'Manual Entry') {
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
    const cost = rows?.filter((ele) => ele.type === 'Manual Entry').map((e) => e?.id)
    const products = rows?.filter((ele) => ele.type !== 'Manual Entry');
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
      rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
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
          disabled={selectedRecords.some((e) => e.type === 'Manual Entry')}
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
      {allowedToEdit && (
        <DetailsPageHeader
          isAddButtonVisible={true}
          addButtonMenuItems={addButtonMenuItems()}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
          previewDownloadProps={previewDownloadProps}
          hasXpadding={false}
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
