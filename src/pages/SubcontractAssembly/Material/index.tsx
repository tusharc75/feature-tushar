import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { useSetWalkmeData, WalkmeData } from 'src/components/CustomIntro';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, MATERIAL_TYPE, SUBCONTRACT_ASSEMBLY_STATUS } from 'src/constants/helpers';
import Consumables from 'src/pages/SubcontractAssembly/Material/Consumables';
import MaterialDialog from 'src/pages/SubcontractAssembly/Material/MaterialDialog';
import {
  addProductConsumable,
  addStepAddExistingProduct,
  deleteExistingProductViaAction,
  editSubcontract
} from 'src/pages/SubcontractAssembly/walkmeSteps';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

const renderedFrom = `${camelCase(routes?.subcontractAssembly.title)}_Material`;

const Material = ({ subcontractAssemblyData, stepFullScreen, allowedToEdit, setNextStep, handleChangeStatus, fetchParentData }) => {
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [open, setOpen] = useState({ open: false, type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [openMaterialDialog, setOpenMaterialDialog] = useState({ open: false, data: null });
  const [material, setMaterial] = useState([]);
  const [productFields, setProductFields] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [subcontractAssemblyData]);

  useEffect(() => {
    if (columns) {
      fetchMaterial();
    }
  }, [columns]);

  const fetchProductFields = async () => {
    let fields;
    const response = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [{ resource: 'Product', fieldNames: ['productName', 'productNumber', 'productDescription'] }]
    });
    fields = response?.data?.data;

    return fields?.find((e) => e.resource === 'Product')?.fieldNames || [];
  };

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, subcontractAssemblyData?.currency);

    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        cell: ({ row }) => <p className="text-truncate">{row?.original?.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];

    const productFields = await fetchProductFields();
    setProductFields(JSON.parse(JSON.stringify(productFields)));

    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          primaryField: true,
          cell: ({ row, table }) => (
            <div className="flex items-center gap-2">
              {!allowedToEdit || subcontractAssemblyData?.quotation ? (
                <p>{row?.original[e?.fieldName]}</p>
              ) : (
                <p
                  onClick={() => {
                    setOpenMaterialDialog({ open: true, data: row?.original });
                  }}
                  className="link text-truncate"
                  title={row?.original[e?.fieldName]}
                >
                  {row?.original[e?.fieldName]}
                </p>
              )}
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row.original?.materialId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          )
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          cell: ({ row }) => {
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });

    const extracolumns: any = [
      ...newColumns,
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row, table }) => {
          return (
            <>
              <HtmlTooltip title={'Edit'}>
                <IconButton
                  size="small"
                  id={`edit-subcontract-${row.index || 0}`}
                  aria-label="Edit"
                  onClick={() => {
                    setOpenMaterialDialog({ open: true, data: row?.original });
                  }}
                >
                  <EditIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
              <HtmlTooltip title={'Delete'}>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Delete"
                    disabled={!row?.original?.canDelete}
                    onClick={() => {
                      const obj: any = [{ id: row.original._id, materialId: row.original?.materialId }];
                      setDeleteData(obj);
                    }}
                  >
                    <DeleteIcon fontSize="small" color={!row?.original?.canDelete ? 'disabled' : 'error'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            </>
          );
        }
      }
    ];

    setColumns([...column, ...extracolumns]);
  };

  const fetchMaterial = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let data;
    const response = await axiosInstance().get(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`);
    data = response?.data?.data?.material;
    setMaterial(JSON.parse(JSON.stringify(data)));
    let rows = data?.filter((d: any) => !d.parentId);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.canDelete = data?.some((e) => e.parentId === parent._id) ? false : true;
      parent.productName = parent?.productDetail?.productName;
      parent.productDescription = parent?.productDetail?.productDescription;
      parent.productNumber = parent?.productDetail?.productNumber;
      parent.hideSelection = parent?.receivedQty > 0 || false;
    });

    if (rows?.length) {
      setNextStep(true);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });

    let walkmeData: WalkmeData[] = [addStepAddExistingProduct];

    if (rows.length && rows[0].canDelete) {
      walkmeData = [addStepAddExistingProduct, deleteExistingProductViaAction, addProductConsumable];
    } else if (!rows[0].canDelete) {
      walkmeData = [addStepAddExistingProduct, addProductConsumable];
    }
    if (rows.length) {
      walkmeData.push(editSubcontract);
    }
    setWalkmeData(walkmeData);
  };

  const ActionButtonMenuItms = () => {
    return (
      <>
        <MenuItem
          disabled={isDeleting || selectedRecords.some((ele) => !ele?.canDelete)}
          onClick={() => {
            const obj: any = [];
            selectedRecords?.forEach((ele) => {
              obj.push({ id: ele._id, materialId: ele.materialId });
            });
            setDeleteData(obj);
          }}
          id="action-delete-menu-item"
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const addMaterial = async (rows) => {
    setIsSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = open.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = null;
      material.push(element);
    });
    await axiosInstance()
      .post(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`, { material })
      .then(() => {
        if (subcontractAssemblyData?.status === SUBCONTRACT_ASSEMBLY_STATUS.new) {
          handleChangeStatus(SUBCONTRACT_ASSEMBLY_STATUS.inProgress);
        }
        fetchMaterial();
        fetchParentData();
        setOpen({ open: false, type: '' });
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleDelete = async (rows) => {
    try {
      setDeleting(true);
      const material = rows?.map((ele) => ({ id: ele.id, materialId: ele.materialId }));

      if (material?.length) {
        await axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material/delete`, { ids: material });
      }
      setDeleting(false);
      fetchMaterial();
      fetchParentData();
      setDeleteData(null);
    } catch (error) {
      setDeleting(false);
      toastConfig.setToastConfig(error);
      setDeleteData(null);
    }
  };

  const handleSaveData = async (rows: any) => {
    try {
      setIsSubmitting(true);
      await axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`, { material: rows });
      fetchMaterial();
      setOpenMaterialDialog({ open: false, data: null });
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={<AddButtonMenuItems setOpen={setOpen} />}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={<ActionButtonMenuItms />}
        actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length) }}
        hasXpadding
      />
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchMaterial}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      <Box mt={3}>
        {productFields && (
          <Consumables
            allowedToEdit={allowedToEdit}
            products={dataRows}
            subcontractAssemblyData={subcontractAssemblyData}
            fetchMaterial={fetchMaterial}
            stepFullScreen={stepFullScreen}
            material={material}
            productFields={productFields}
          />
        )}
      </Box>
      {open.open && open.type === MATERIAL_TYPE.product && (
        <AssignProductDialog
          handleCloseDialog={() => setOpen({ open: false, type: '' })}
          onSuccess={(products) => {
            addMaterial(products);
          }}
          isSubmitting={isSubmitting}
        />
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
      {openMaterialDialog.open && (
        <MaterialDialog
          onClose={() => {
            setOpenMaterialDialog({ open: false, data: null });
          }}
          subcontractAssemblyData={subcontractAssemblyData}
          rowData={openMaterialDialog.data}
          material={dataRows}
          allFields={allFields}
          handleSaveData={handleSaveData}
          loading={isSubmitting}
        />
      )}
    </>
  );
};

export default Material;

const AddButtonMenuItems = ({ setOpen }) => {
  return (
    <>
      <MenuItem
        onClick={() => {
          setOpen({ open: true, type: MATERIAL_TYPE.product });
        }}
        id="add-existing-product-menu-item"
      >
        Add Existing Products
      </MenuItem>
    </>
  );
};
