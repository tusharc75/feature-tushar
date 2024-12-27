import { Box, IconButton, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, fieldServiceOrder } from '../../../constants/helpers';
import ServiceOrderQty from './ServiceOrderQty';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Services = ({ serviceOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }: any) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var allFields = await fetch_child_resource_fields(CHILD_RESOURCE.fieldServiceOrderDetails, serviceOrderData?.currency, allowedToEdit);
    setAllFields(allFields);
    const newColumns = generateColumns(renderedFrom, allFields, null, false, serviceOrderData?.currency);
    let column: any = [
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
        width: 70,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p
              onClick={() => {
                setIsProductEdit({
                  open: true,
                  data: row.original,
                  bulkedit: false,
                  showSaveAndNext: row?.index < table.getRowModel().rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
                });
              }}
              className="link text-truncate"
              title={row.original.detail}
            >
              {row.original.detail}
            </p>
            {row.original.type === MATERIAL_TYPE.package && (
              <>
                <HtmlTooltip title="Add Product">
                  <IconButton
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: MATERIAL_TYPE.product, parentId: row.original?._id });
                    }}
                    size="small"
                  >
                    <AddIcon fontSize="small" color="primary" />
                  </IconButton>
                </HtmlTooltip>
              </>
            )}
            <IconButton
              size="small"
              style={{ marginLeft: '10px' }}
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
          </div>
        )
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        return allowedToEdit ? (
          !row.original.canDelete ? (
            <HtmlTooltip title={'Technician is already assigned'}>
              <span>
                <IconButton size="small" aria-label="Details" disabled={true}>
                  <DeleteIcon fontSize="small" color={'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : (
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                    getNestedSubRows(obj, row.original);
                    setDeleteData(obj);
                  }}
                >
                  <DeleteIcon fontSize="small" color={'error'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          )
        ) : (
          ''
        );
      }
    });
    setColumns(column);
  };

  const fetchProductInventory = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/material`);
    data = response?.data?.data;
    const responseTechnician = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/technician`);
    const technician = responseTechnician?.data?.data;

    let rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent?.productDetail?.productName
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent?.packageDetail?.packageName;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : '';
      parent.canDelete = technician.some((d) => d._id === parent._id) ? false : true;
      parent.estimateStartDate = parent.estimateStartDate ? parent.estimateStartDate : serviceOrderData?.estimateStartDate;
      parent.estimateEndDate = parent.estimateEndDate ? parent.estimateEndDate : serviceOrderData?.estimateEndDate;
      parent.subRows = generateNestedData(data.material, parent, technician);
    });

    if (rows?.length > 0) {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent, technician) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.canDelete = technician.some((d) => d.service.optionValue === _subRow._id) ? false : true;
      _subRow.estimateStartDate = _subRow.estimateStartDate ? _subRow.estimateStartDate : serviceOrderData?.estimateStartDate;
      _subRow.estimateEndDate = _subRow.estimateEndDate ? _subRow.estimateEndDate : serviceOrderData?.estimateEndDate;
      _subRow.subRows = generateNestedData(material, _subRow, technician);
    });
    return subRows;
  };

  const handleAdd = (rows) => {
    setSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.pricingMethod =
        d?.pricingMethodMain && d?.pricingMethodMain?.length ? d.pricingMethodMain[0] : d?.pricingMethod ? d?.pricingMethod : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      element.estimateStartDate = serviceOrderData?.estimateStartDate;
      element.estimateEndDate = serviceOrderData?.estimateEndDate;
      material.push(element);
    });
    axiosInstance()
      .post(`${fieldServiceOrder.api}/${serviceOrderData._id}/material`, { material })
      .then(({ data }) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchProductInventory();
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
      .put(`${fieldServiceOrder.api}/${serviceOrderData._id}/material`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchProductInventory();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          setIsProductEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setIsProductEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
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
      .put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material/delete `, { ids: rows.map((d) => d.id) })
      .then(() => {
        setDeleting(false);
        fetchProductInventory();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedRecords?.length && selectedRecords?.filter((e) => e.canDelete);
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, serviceOrderData?.currency);
    handleSaveData(rows);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'service', parentId: null });
          }}
        >
          Add Services
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
          }}
        >
          Add Service Packages
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={isDeleting}
          onClick={() => {
            handleDeleteMultiple();
          }}
        >
          Delete
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsProductEdit({
              open: true,
              data: selectedRecords?.filter((e) => !e.hideSelection),
              bulkedit: true,
              showSaveAndNext: false
            });
          }}
        >
          Bulk Edit
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <>
            <DetailsPageHeader
              isAddButtonVisible={true}
              addButtonMenuItems={addButtonMenuItems()}
              isActionButtonVisible={true}
              actionButtonMenuItems={actionButtonMenuItems()}
              actionButtonProps={{ disabled: !Boolean(selectedRecords?.length && selectedRecords?.filter((e) => e.canDelete).length) }}
              hasXpadding
            />
          </>
        )}
        <Grid size={{xs:12, md:12, sm:12}}>
          {columns ? (
            <Box zIndex={5}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchProductInventory}
                hideSelection={!allowedToEdit}
                hideAction={!allowedToEdit}
                renderedFrom={renderedFrom}
                onSaveEdit={onSaveInlineEdit}
                isClientSideGrid={true}
                expander={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'package' && (
        <AssignPackageDialog
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          packageType="service"
          isSubmitting={isSubmitting}
        />
      )}
      {isProductEdit.open && (
        <ServiceOrderQty
          onClose={() => {
            setIsProductEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
          }}
          rowData={isProductEdit.data}
          serviceOrderData={serviceOrderData}
          handleSaveData={handleSaveData}
          showSaveAndNext={isProductEdit?.showSaveAndNext}
          isBulkedit={isProductEdit.bulkedit}
          loadingEdit={isUpdating}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'service' && (
        <AssignServiceDialog
          onSuccess={(services) => {
            handleAdd(services);
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
        <AssignProductDialog
          handleCloseDialog={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(product) => {
            handleAdd(product);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default Services;
