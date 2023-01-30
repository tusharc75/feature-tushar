import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { dateTimeFormat, formatAmountWithCurrency, serviceOrder, sidebarResource } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { startCase } from 'lodash';
import { calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ServiceOrderQty from './ServiceOrderQty';
import moment from 'moment';
import { fetch_service_order_detail_fields } from 'src/components/ServiceOrder/helper';
import { genrateCustomTableColumns } from 'src/constants/columns';

const Services = ({
  serviceOrderData,
  setNextStep,
  currencySymbol,
  renderedFrom,
  stepFullScreen,
  allowedToEdit
}: any) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, data: null });
  const [isAddingProducts, setAddingProducts] = useState(false);


  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var { fields: data, allFields } = await fetch_service_order_detail_fields(serviceOrderData?.currency);
    const newColumns = genrateCustomTableColumns(allFields, serviceOrderData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex(d => d.accessor === 'qty')
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay'
    }
    let column: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p
              onClick={() => {
                setIsProductEdit({ open: true, data: row.original });
              }}
              className="link text-truncate"
              title={row.original.detail}
            >
              {row.original.detail}
            </p>
            <IconButton
              size="small"
              style={{ marginLeft: "10px" }}
              onClick={() => {
                if (row.original.type === 'service') {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </div>
        )
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return allowedToEdit ? (
          (!row.original.canDelete) ? (
            <HtmlTooltip title={'Asset is already assigned'}>
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

    setNextStep(false);

    var data: any = [];

    const response = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/material`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    let rows = data.material.filter((e) => e.parentId === null);
    const responseTechnician = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/technician`);
    const technician = responseTechnician?.data?.data;

    rows = rows.filter((e) => e.type === 'service' || (e.type === 'package' && e.packageDetail?.packageType === 'Service'));

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
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
            ? parent?.productDetail?.productDesc || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : '';
      parent.qtyDisplay = parent.qty;
      parent.canDelete = technician.some(d => d._id === parent._id) ? false : true;
      parent.estimateStartDate = parent.estimateStartDate ? parent.estimateStartDate : serviceOrderData?.estimateStartDate
      parent.estimateEndDate = parent.estimateEndDate ? parent.estimateEndDate : serviceOrderData?.estimateEndDate
      parent.subRows = generateNestedData(data.material, parent, technician);
    });

    if (rows?.length > 0) {
      setNextStep(true);
    }

    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent, technician) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
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
            ? _subRow?.productDetail?.productDesc || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty} `;
      _subRow.canDelete = technician.some(d => d.service.optionValue === _subRow._id) ? false : true;
      _subRow.estimateStartDate = _subRow.estimateStartDate ? _subRow.estimateStartDate : serviceOrderData?.estimateStartDate
      _subRow.estimateEndDate = _subRow.estimateEndDate ? _subRow.estimateEndDate : serviceOrderData?.estimateEndDate
      _subRow.subRows = generateNestedData(material, _subRow, technician);
    });
    return subRows;
  };

  const handleAdd = (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.pricingMethod = d?.pricingMethodMain && d?.pricingMethodMain?.length ? d.pricingMethodMain[0] : d?.pricingMethod ? d?.pricingMethod : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      element.estimateStartDate = serviceOrderData?.estimateStartDate
      element.estimateEndDate = serviceOrderData?.estimateEndDate
      material.push(element);
    });
    axiosInstance()
      .post(`${serviceOrder.api}/${serviceOrderData._id}/material`, { material: material })
      .then(() => {
        setUpdating(false);
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchProductInventory();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.isValid;
      delete element.canDelete;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.parentName;
      delete element.subRows;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${serviceOrder.api}/${serviceOrderData._id}/material`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, data: null });
        fetchProductInventory();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${serviceOrder.api}/${serviceOrderData?._id}/material/delete `, { ids: rows.map(d => d.id) })
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

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedProducts && selectedProducts.filter((e) => e.canDelete);
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex">
                {permissions?.serviceMaster?.isRead && (
                  <Button
                    className={'btn-outline-v1'} variant="contained" size="small"
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'service', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Service' : `Add Services`}
                  </Button>
                )}
                <Box mx={isMobile ? 0.5 : 1} />
                {permissions?.packages?.isRead && (
                  <Button
                    className={'btn-outline-v1'} variant="contained" size="small"
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Package' : `Add Service ${routes.packages.title}`}
                  </Button>
                )}
              </Box>
              <Box display="flex">
                <Button
                  variant={'outlined'}
                  color="primary"
                  size="small"
                  onClick={handleClick}
                  disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => e.canDelete).length)}
                  endIcon={<BiChevronDown />}
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  onClose={handleClose}
                >
                  <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
                    <MenuItem
                      disabled={isDeleting}
                      onClick={() => {
                        handleDeleteMultiple();
                        handleClose();
                      }}
                    >
                      Delete
                    </MenuItem>
                  </HtmlTooltip>
                </Menu>
              </Box>
            </Box>
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}  >
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                columns={columns}
                data={rowsData}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={!allowedToEdit}
                renderedFrom={`${renderedFrom}_sevices_1`}
                onSaveEdit={onSaveInlineEdit}
                material={material}
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500} bgcolor="white">
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
          referenceType={"serviceOrder"}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          packageType="service"
          ids={[]}
        />
      )}
      {isProductEdit.open && (
        <ServiceOrderQty
          onClose={() => {
            setIsProductEdit({ open: false, data: null });
          }}
          rowData={isProductEdit.data}
          serviceOrderData={serviceOrderData}
          handleSaveData={handleSaveData}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'service' && (
        <AssignServiceDialog
          reference={'service'}
          onSuccess={(services) => {
            handleAdd(services.map((d) => ({ ...d, detail: d.serviceName })));
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          ids={[]}
        />
      )}
    </Fragment>
  );
};

export default Services;
