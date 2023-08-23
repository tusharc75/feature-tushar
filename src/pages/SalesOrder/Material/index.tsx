import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, MenuItem, MenuList, Popover, Menu } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import Add from '@material-ui/icons/Add';
import { pricingCondition, salesOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { isMobile } from 'react-device-detect';
import { startCase } from 'lodash';
import DateRangeIcon from '@material-ui/icons/DateRange';
import SalesOrderQtyDialog from './SalesOrderQtyDialog';
import { fetch_salesOrder_product_fields } from 'src/components/SalesOrder/helper';
import LeadTimeDialog from './LeadTimeDialog';
import { generateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AddIcon from '@material-ui/icons/Add';
import { ExpandMore, KeyboardArrowDown } from '@material-ui/icons';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const Material = ({ salesOrderData, setNextStep, renderedFrom, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false, showSaveAndNext: false });
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchFields();
  }, []);
  const fetchFields = async () => {
    var data = await fetch_salesOrder_product_fields(salesOrderData?.currency);
    setAllFields(JSON.parse(JSON.stringify(data)));

    const newColumns = generateCustomTableColumns(data, salesOrderData?.currency, renderedFrom);

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
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
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {
              <p
                onClick={() => {
                  handleOpen(row, rows);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            }

            {row?.original?.type !== 'service' && (
              <Box ml={1} className="d-flex align-items-center">
                {row.original?.subRows?.length > 0 && (
                  <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                )}
                <Box pl={1}>
                  <HtmlTooltip title="Add ">
                    <IconButton
                      onClick={(event) => setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX })}
                      size="small"
                    >
                      <Add color="disabled" fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
              </Box>
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
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0),
        Footer: (info) => {
          const total = info.rows
            .filter((f) => f.values.hasOwnProperty('leadTime') && !isNaN(f.values['leadTime']))
            .reduce((sum, row) => parseInt(row.values['leadTime']) + sum, 0);
          return <>{total}</>;
        }
      }
    ];
    const isPriceRequired = data.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 140,
      width: 140,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row, rows }) =>
        !row.original.hideSelection && (
          <Grid container spacing={1}>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                handleOpen(row, rows);
              }}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                setLeadTimeDialog({ open: true, data: row.original });
              }}
            >
              <DateRangeIcon fontSize="small" color="primary" />
            </IconButton>
            <Box ml={1} />
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
    fetchMaterialData();
  };

  const fetchMaterialData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === 'product'
          ? parent?.productDetail?.productDescription
          : parent.type === 'package'
            ? parent?.packageDetail?.packageDescription
            : parent?.serviceDetail?.serviceDescription;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qty = parent.qty;
      parent.isValid = parent['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${_subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === 'package'
            ? _subRow?.packageDetail?.packageDescription
            : _subRow?.serviceDetail?.serviceDescription;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qty = `${parent.qty * _subRow.qty} `;
      _subRow.isValid = _subRow['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const openAddMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeAddMenu = () => {
    setAnchorEl(null);
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      element.unit = d?.unit && d?.unitMain?.length ? d?.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog.parentId;
      material.push(element);
    });

    const priceData: any = await calculatePrice(material);
    material.forEach((element) => {
      const rateResult = priceData?.filter(
        (e) =>
          e.materialId === element.materialId &&
          e.materialType === element.type &&
          e.unit === element.unit &&
          e.pricingMethod === element.pricingMethod
      );
      if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${salesOrderData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${salesOrder.api}/material/${salesOrderData._id}`, { material })
      .then(() => {
        setAddDialog({ open: false, type: '', parentId: null });
        fetchMaterialData();
        setAddingProducts(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    rows.forEach((element) => {
      delete element.index;
      delete element.detail;
      delete element.description;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.subRows;
      delete element.leadTime;
      delete element.leadTimeData;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${salesOrder.api}/material/${salesOrderData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          setRecordToUpdate(rowsData[rowIndex + 1]);
          setIsProductEdit({
            open: true,
            isBulkedit: false,
            showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false
          });
        } else {
          setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
        }
        fetchMaterialData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${salesOrder.api}/material/${salesOrderData?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchMaterialData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleOpen = (row, rows) => {
    setIsProductEdit({
      open: true,
      isBulkedit: false,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
    setRecordToUpdate(row.original);
  };

  const calculatePrice = (arr: any[]) => {
    if (salesOrderData) {
      const data: any = {};
      data.conditionType = ['Price'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: salesOrderData?.currency
      }));
      data.supplier = [];
      data.customer = [salesOrderData?.customerAccount?.optionValue];
      data.warehouse = [salesOrderData?.warehouse?.optionValue];
      return new Promise((resolve, reject) => {
        axiosInstance()
          .post(pricingCondition.api + `/calculatePrice`, data)
          .then(({ data: { data } }) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button variant="outlined" size="small" onClick={openAddMenu} startIcon={<AddIcon />} color="primary">
            Add
            <ExpandMore fontSize="small" />
          </Button>
          <Menu
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={closeAddMenu}
          >
            {permissions?.product?.isRead && (
              <MenuItem
                color="primary"
                onClick={() => {
                  setAddDialog({ open: true, type: 'product', parentId: null });
                  closeAddMenu();
                }}
              >
                {`Add Products`}
              </MenuItem>
            )}

            {permissions?.packages?.isRead && (
              <MenuItem
                color="primary"
                onClick={() => {
                  setAddDialog({ open: true, type: 'package', parentId: null });
                  closeAddMenu();
                }}
              >
                {`Add Packages`}
              </MenuItem>
            )}
            {permissions?.serviceMaster?.isRead && (
              <MenuItem
                color="primary"
                onClick={() => {
                  setAddDialog({ open: true, type: 'service', parentId: null });
                  closeAddMenu();
                }}
              >
                {`Add Services`}
              </MenuItem>
            )}
          </Menu>
        </Box>
        <Box display="flex">
          <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                onClick={openActions}
                endIcon={<KeyboardArrowDown fontSize="small" />}
                className="new-dropdown-v1"
              >
                Actions
              </Button>
            </span>
          </HtmlTooltip>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            open={Boolean(anchorActionEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={() => {
                setIsProductEdit({ open: true, isBulkedit: true, showSaveAndNext: false });
                closeActions();
              }}
            >
              Bulk Edit
            </MenuItem>

            <MenuItem
              onClick={() => {
                const dataToDelete =
                  selectedProducts &&
                  selectedProducts
                    .filter((e) => !e.hideSelection)
                    .map((rec: any) => {
                      const obj: any = {};
                      obj.id = rec._id;
                      obj.type = rec?.type;
                      obj.materialId = rec?.materialId;
                      return obj;
                    });
                setDeleteData(dataToDelete);
                closeActions();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {columns && rowsData ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom="sales_order_product_package"
              isClientSideGrid={true}
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
      {isProductEdit.open && (
        <SalesOrderQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
          salesOrderData={salesOrderData}
          loadingEdit={isUpdating}
          showSaveAndNext={isProductEdit?.showSaveAndNext}
        />
      )}
      {addchildDialog.open && (
        <Popover
          anchorReference="anchorPosition"
          anchorPosition={{ top: addchildDialog.top, left: addchildDialog.bottom }}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={addchildDialog.open}
          onClose={() => {
            setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'product', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Product
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'package', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Package
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'service', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Services
            </MenuItem>
          </MenuList>
        </Popover>
      )}
      {leadTimeDialog.open && (
        <LeadTimeDialog
          salesOrderId={salesOrderData._id}
          data={leadTimeDialog?.data}
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setLeadTimeDialog({ open: false, data: null });
            fetchMaterialData();
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          reference="salesOrder"
          serialized={null}
          productsDialogOpen={addDialog.open}
          productId={null}
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          assignedProducts={[]}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'service' && (
        <AssignServiceDialog
          reference={'salesOrder'}
          referenceId={salesOrderData?._id}
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType="salesOrder"
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={null}
        />
      )}
    </Fragment>
  );
};

export default Material;
