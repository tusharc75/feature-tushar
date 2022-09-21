import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, CircularProgress, Menu, MenuItem, Chip, MenuList, ListItemIcon, ListItemText } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import { repairOrder, dateFormat, formatAmountWithCurrency } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import EditIcon from '@material-ui/icons/Edit';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';

const Quotation = ({ repairOrderData, setNextStep, currencySymbol, isTabletScreen, isSmallScreen, showActivity, renderedFrom, stepFullScreen, allowedToEdit }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
    fetchQuotationData();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var data = await fetch_quotation_product_fields(repairOrderData?.currency);
    const coloum: any = [
      {
        accessor: 'srno',
        Header: '#',
        width: 70,
        sticky: isMobile ? "none" : "left",
        Cell: ({ row }) => (
          <p className="text-truncate"  >
            {row.original.srno}
          </p>),
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOffline || !allowedToEdit || row.original.type !== 'service' ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  handleOpen(row.original);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
            {<Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>}
            {!isOffline && (
              <Chip
                className="ml-1"
                label={`${row.original.type === 'service' ? "Service"
                  : row.original.type === 'product' ? "Product" : "Package"}`}
                size="small"
                color="primary"
                onClick={() => {
                  window.open(
                    `${row.original.type === 'service' ? routes.serviceMasterDetail.path : row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                  );
                }}
              />
            )}
          </div>
        ),
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'workOrder',
        Header: 'Work Order',
        Cell: ({ row }) => (
          row.original['workOrder'] ?
            <a className="link text-truncate" href={`${routes.workOrderDetail.path}/${row.original['workOrder']._id}`} target="_blank">{row.original['workOrder'].workOrderNumber}</a>
            : <NoDataCell />
        )
      }
    ];
    data.forEach((element) => {

      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
        });
      } else if (element.fieldName === 'supplierAccount') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? (
              <p className="text-truncate">{row.original[element.fieldName].map((d) => d?.optionLabel).toString()}</p>
            ) : (
              <NoDataCell />
            )
        });
      } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
        if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            let fieldName = element.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _unit;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
            });
          });
        } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) =>
                  row.original[fieldName] ? (
                    <p>{formatAmountWithCurrency("USD", row.original[fieldName])?.amountWithouCurrencyCode}</p>
                  ) : (
                    <NoDataCell />
                  )
              });
            });
          });
        } else if (element.type === 'currencyAmount') {
          element.displayCurrency.forEach((_currency) => {
            let fieldName = element.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _currency;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) =>
                row.original[fieldName] ? (
                  <p>{formatAmountWithCurrency("USD", row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                )
            });
          });
        }
      } else {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
        });
      }
    });
    {
      isMobile ? <Box display={"none"} /> : coloum.push({
        accessor: 'action',
        Header: '',
        minWidth: 70,
        width: 70,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }) =>
          <>

            {row.original.type !== 'product' && <HtmlTooltip title={"Edit Service"}>
              <span>
                <IconButton
                  size="small"
                  aria-label="History"
                  onClick={() => {
                    handleOpen(row.original);
                  }}
                >
                  <EditIcon color="primary" />
                </IconButton>
              </span>
            </HtmlTooltip>}
          </>
      });
    }
    coloum.forEach((element) => {
      if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns(coloum);
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    var nonSerializeAsset: any = [];
    const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/service/post-work`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data.inventory;
    nonSerializeAsset = data.nonSerializeAsset;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = (i + 1);
      parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName}`;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.assetQty = parent.serializedProduct ? inventory?.filter((e) => e._id === parent._id).length : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
      parent.hideSelection = false;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });

    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }

    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows = material.filter((e) => e.parentId === parent._id);
    const services = parent?.services?.filter(d => d.packageId === undefined || d.packageId === null || d.packageId === "").map(d => {
      return {
        ...d,
        materialId: d._id,
        parentId: parent._id,
        workOrder: parent.workOrder,
        type: "service"
      }
    });
    const packages = parent?.packages?.map(d => {
      return {
        ...d,
        materialId: d._id,
        parentId: parent._id,
        workOrder: parent.workOrder,
        type: "package"
      }
    });

    let combinedData = [...subRows, ...packages, ...services]
    combinedData.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow?.type === "service" ? _subRow?.serviceName : _subRow?.type === "package" ? _subRow?.packageName : _subRow?.productDetail?.productName;
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = _subRow?.serviceName ? `` : `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.assetQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.hideSelection = false;;
      _subRow.subRows = _subRow?.type === "package" ? getPackageSubRows(parent, _subRow) : _subRow?.type !== "service" ? generateNestedData(material, inventory, nonSerializeAsset, _subRow) : null;
    });
    if (combinedData.length === 0 && parent.type === "package") {
      parent.isValid = false;
    }
    if (parent.type === "package") {
      parent.hideSelection = combinedData.filter((e) => e.hideSelection).length ? true : false;
    }
    return combinedData;
  }

  const getPackageSubRows = (parent, subRowPackage: any) => {

    const services = parent?.services?.filter(d => d.packageId === subRowPackage._id).map(d => {
      return {
        ...d,
        materialId: d._id,
        parentId: parent._id,
        workOrder: parent.workOrder,
        type: "service"
      }
    });
    services.forEach((_subRow, j) => {
      _subRow.srno = subRowPackage.srno + '.' + (j + 1);
      _subRow.detail = _subRow?.serviceName;
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = _subRow?.serviceName ? `` : `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.hideSelection = false;;
      _subRow.isValid = true;
      _subRow.subRows = null;
    });
    return services;
  }

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  }

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      element.workOrder = element.workOrder._id
      delete element._id
      delete element.serviceId
      delete element.serviceName
      delete element.serviceDescription
      delete element.serviceImage
      delete element.preWork;
      delete element.user;
      delete element.brand;
      delete element.entity;
      delete element.createdBy;
      delete element.steps;
      delete element.materialId;
      delete element.parentId;
      delete element.srno
      delete element.detail;
      delete element.serializedProduct;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.subRows;
      delete element.services;
      delete element.package;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData._id}/service/update-price`, rows)
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchProductInventory();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
  };

  const fetchQuotationData = () => {
    axiosInstance()
      .get(`${repairOrder.api}/${repairOrderData._id}/quotation`)
      .then(({ data: { data } }) => {
        setQuotationData(data)
      })
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="flex-end" pt={1} pb={2} >
        <Box display="flex" alignItems="center" justifyContent={"flex-end"} paddingX={1} gridColumnGap={8} flex={1}>
          <Box display="flex" gridColumnGap={5}>
            {quotationData?._id ?
              <Button
                variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                color="primary"
                size="small"
                style={!isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                onClick={() => {
                  window.open(
                    `${routes.quotationDetail.path}/${quotationData?._id}`
                  );
                }}
              >
                View Quotation
              </Button>
              : <Button
                variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                color="primary"
                size="small"
                style={!isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                onClick={() => {
                  axiosInstance()
                    .post(`${repairOrder.api}/${repairOrderData._id}/quotation`)
                    .then(({ data }) => {
                      toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                      });
                      fetchQuotationData();
                    })
                    .catch((error) => {
                      toastConfig.setToastConfig(error);
                    });
                }}
              >
                Create Quotation
              </Button>}
          </Box>
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box
              zIndex={5}
              width={stepFullScreen ? '100%' : isTabletScreen ? 'calc(100vw)' : isSmallScreen ? 'calc(100vw)' : showActivity ? '100%' : 'calc(100vw - 103px)'}
              height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 345px)"}
            >
              <CustomReactTable
                height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 345px)"}
                columns={columns}
                data={rowsData}
                setWholeRowsCellColor={(rowData) => !rowData.isValid ? "error" : ""}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={false}
                renderedFrom="repair_order_workorder_product_package"
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
      {isProductEdit.open && (
        <QuotationQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          quotationData={repairOrderData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
        />
      )}
    </Fragment>
  );
};

export default Quotation;
