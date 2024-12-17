import { Box, Grid, IconButton, MenuItem } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CHILD_RESOURCE, MATERIAL_TYPE, gridLoadingTimeout, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import MaterialDialog from './MaterialDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Material = ({ demandOrderData, fetchDemadOrderData, allowedToEdit, resources }) => {
  const renderedFrom = `${camelCase(sidebarResource?.demandOrder)}_material`;

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const [isUpdating, setUpdating] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);

  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.demandOrderDetail, demandOrderData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      demandOrderData?.currency || 'USD'
    );
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        primaryField: true,
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
        Cell: ({ row, table }) => (
          <div className="flex flex-nowrap items-center gap-2">
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
            {allowedToEdit && (
              <>
                <Box>
                  <span>({row.original?.subRows?.length})</span>
                </Box>
                <Box>
                  <HtmlTooltip title="Add Product">
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
            <Box>
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
        <Grid container spacing={1}>
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
          <IconButton
            size="small"
            aria-label="Details"
            onClick={() => {
              const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
              setDeleteData(obj);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Grid>
      )
    });
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    try {
      var data: any = [];
      const response = await axiosInstance().get(`${routes.demandOrder.path}/material/${demandOrderData._id}`);
      data = response?.data?.data;
      let rows = data.material.filter((e) => e.parentId === null);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = parent.type === MATERIAL_TYPE.product ? parent.productDetail?.productName : parent.packageDetail?.packageName;
        parent.description =
          parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.productDescription : parent?.packageDetail?.packageDescription;
        parent.qty = parent.qty;
        parent.qtyDisplay = parent.qty;
        parent.subRows = generateNestedData(data.material, parent);
      });

      dispatch({ type: 'initialize', data: rows, count: data.length });
      setRowsData(rows);
      setSelectedRecords([]);
    } catch (error) {
      dispatch({ type: 'error', error: true });
      console.error(error);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
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
            : _subRow.serviceDetail?.serviceName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow?.serviceDetail?.serviceDescription;
      _subRow.qty = _subRow.qty;
      _subRow.qtyDisplay = parent.qtyDisplay * _subRow.qty;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
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
      .post(`${routes?.demandOrder?.path}/material/${demandOrderData._id}`, { material })
      .then(({ data }) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        fetchDemadOrderData();
        setSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.demandOrder.path}/material/${demandOrderData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        fetchDemadOrderData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          setMaterialEdit({
            open: true,
            data: rowsData[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false
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

  const onMaterialEdit = (row, rows) => {
    setMaterialEdit({
      open: true,
      data: row.original,
      bulkedit: false,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData, demandOrderData?.currency);
    handleSaveData(rows);
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.demandOrder.path}/material/${demandOrderData?._id}/delete`, { ids: rows })
      .then(({ data }) => {
        setDeleting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        fetchDemadOrderData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
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
        <MenuItem
          onClick={() => {
            setAddDialog({ open: true, type: MATERIAL_TYPE.package, parentId: null });
          }}
        >
          Add Existing Packages
        </MenuItem>
      </>
    );
  };

  const previewDownloadProps = {
    fileName: `${resources?.demandOrder?.titlePlural}-${demandOrderData?.demandOrderNumber}`,
    resource: sidebarResource.demandOrder,
    referenceId: demandOrderData?._id,
    columns: columns
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
          {`Delete (${selectedRecords?.length})`}
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
        hasXpadding={false}
      />
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 345px)'}
              columns={columns}
              onSelect={setSelectedRecords}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              onSaveEdit={onSaveInlineEdit}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              expander={true}
              state={state}
              dispatch={dispatch}
              refreshGrid={fetchData}
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
          message={`Are you sure you want to delete ${deleteData ? `${resources?.demandOrder?.titleSingular?.toLowerCase()} :
            ${deleteData?.demandOrderNumber || ''}` : resources?.demandOrder?.titlePlural?.toLowerCase()} ?`}
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
          demandOrderData={demandOrderData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.product && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.package && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default Material;
