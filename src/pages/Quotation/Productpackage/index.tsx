import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem, MenuList, Popover } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import { quotation, pricingCondition, supplierContact } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import QuotationQtyDialog from './QuotationQtyDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile } from 'react-device-detect';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import PriceRequestDialog from './PriceRequestDialog';
import { ExpandMore } from '@material-ui/icons';
import AskSupplierPriceDialog from './AskSupplierPriceDialog';
import { startCase } from 'lodash';
import LeadTimeDialog from './LeadTimeDialog';
import DateRangeIcon from '@material-ui/icons/DateRange';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { flattenArray, genrateCustomTableColumns } from 'src/constants/columns';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';

const Productpackage = ({ quotationData, setNextStep, renderedFrom, stepFullScreen, version, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
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
  const [requestDialog, setRequestDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);
  const [supplierContactData, setSupplierContactData] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const versionId = quotationData?.versions[version]?._id || null;

  useEffect(() => {
    fetchFields();
    if (version) {
      fetchData();
    }
  }, [version]);

  const fetchFields = async () => {
    var data = await fetch_quotation_product_fields(quotationData?.currency);
    if (!allowedToEdit) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = genrateCustomTableColumns(data, quotationData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
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
        sticky: isMobile ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p
              onClick={() => {
                handleOpen(row.original);
              }}
              className="link text-truncate"
              title={row.original?.detail}
            >
              {row.original?.detail}
            </p>
            {row.original?.subRows?.length ? (
              <Box ml={1}>
                <span>({row.original?.subRows?.length})</span>
              </Box>
            ) : null}
            <Box ml={1}>
              <HtmlTooltip title="Add ">
                <IconButton
                  onClick={(event) => setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX })}
                  size="small"
                >
                  <Add color="disabled" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </Box>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(
                    `${
                      row.original.type === 'serializedAsset'
                        ? routes.serializedAssetDetail.path
                        : row.original.type === 'product'
                        ? routes.productDetail.path
                        : row.original.type === 'package'
                        ? routes.packagesDetail.path
                        : routes.serviceMasterDetail.path
                    }/${row.original.materialId}`
                  );
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
          </div>
        )
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
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: '',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) =>
        !row.original.hideSelection && (
          <Grid container spacing={1}>
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
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.srno = parent.srno + '.' + `${index + 1}`;
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail?.assetNumber
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
      _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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
        const priceFieldName = `price_${quotationData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`, { material })
      .then(() => {
        setAddDialog({ open: false, type: '', parentId: null });
        fetchData();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.serializedAssetDetail;
      delete element.subRows;
      delete element.leadTime;
      delete element.leadTimeData;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${versionId}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
  };

  const calculatePrice = (arr: any[]) => {
    if (quotationData) {
      const data: any = {};
      data.conditionType = ['Price'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: quotationData?.currency
      }));
      data.supplier = [];
      data.customer = [quotationData?.customerAccount?.optionValue];
      data.warehouse = [quotationData?.warehouse?.optionValue];
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

  const handelAskPriceToSupplier = (content, contactId, selectedFields = [], displayColumns = []) => {
    let data: any = {
      material: selectedProducts?.map((d) => {
        return {
          _id: d?._id,
          materialId: d?.materialId
        };
      }),
      quotationId: quotationData?._id,
      protected: true,
      body: content ? content : '',
      supplierContact: contactId,
      requiredFields: selectedFields,
      versionId: versionId
    };

    axiosInstance()
      .post(`/quotation/supplier-price-request/ask-price-supplier`, data)
      .then(() => {
        toastConfig.setToastConfig({
          message: `Email has been sent to suppliers`,
          type: 'success',
          open: true
        });
        setAskSupplierPriceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button variant={'outlined'} color="primary" size="small" startIcon={<Add />} onClick={openAddActions} aria-controls="add-menu">
            {'Add'}
            <ExpandMore fontSize="small" />
          </Button>
          <Menu
            anchorEl={addAnchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="add-menu"
            open={Boolean(addAnchorEl)}
            onClose={closeAddActions}
          >
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddDialog({ open: true, type: 'product', parentId: null });
              }}
            >
              Add Products
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddDialog({ open: true, type: 'package', parentId: null });
              }}
            >
              Add Packages
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddDialog({ open: true, type: 'service', parentId: null });
              }}
            >
              Add Services
            </MenuItem>
          </Menu>
        </Box>
        <Box display="flex">
          <div className="d-flex gap-2">
            <span>
              <Button
                variant={'outlined'}
                color="default"
                size="small"
                disabled={rowsData?.length > 0 ? false : true}
                onClick={openActions}
                aria-controls="action-menu"
                endIcon={<ExpandMore />}
              >
                {'Actions'}
              </Button>
            </span>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <MenuItem
                disabled={selectedProducts.length === 0}
                onClick={() => {
                  let tempSupplierAccountId = [];
                  selectedProducts?.forEach((element) => {
                    element?.supplierAccount?.forEach((e) => {
                      if (tempSupplierAccountId.findIndex((d) => d === e?.optionValue) === -1) {
                        tempSupplierAccountId.push(e?.optionValue);
                      }
                    });
                  });
                  axiosInstance()
                    .get(
                      `${supplierContact.contactApi}?filterById=${JSON.stringify([
                        { field: 'accountName', term: { $in: tempSupplierAccountId } }
                      ])}&filterType=and`
                    )
                    .then(({ data: { data, count } }) => {
                      setSupplierContactData(data);
                      setAskSupplierPriceDialog(true);
                    })
                    .catch((error) => {
                      toastConfig.setToastConfig(error);
                    });
                  closeActions();
                }}
              >
                Ask Supplier to Quote
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSelectedType('Supplier');
                  setRequestDialog(true);
                  closeActions();
                }}
              >
                View Supplier Quote
              </MenuItem>
              {/* <MenuItem
                onClick={() => {
                  setSelectedType('Customer');
                  setRequestDialog(true);
                  closeActions();
                }}
              >
                View Customer Price
              </MenuItem> */}
              <MenuItem
                disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                onClick={() => {
                  setIsProductEdit({ open: true, isBulkedit: true });
                  closeActions();
                }}
              >
                Bulk Edit
              </MenuItem>
              <MenuItem
                disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
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
          </div>
        </Box>
      </Box>
      {columns && rowsData ? (
        <Box p="6px" zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            renderedFrom="quotation_product_package"
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
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
        <QuotationQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          quotationData={quotationData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
        />
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          reference={'quotation'}
          serialized={null}
          productsDialogOpen={addDialog.open}
          productId={null}
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          assignedProducts={[]}
          renderedFrom={renderedFrom}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'service' && (
        <AssignServiceDialog
          reference={'quotation'}
          referenceId={quotationData?._id}
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType={'quotation'}
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={null}
        />
      )}
      {requestDialog && selectedType && (
        <PriceRequestDialog
          quoteData={quotationData}
          versionId={versionId}
          type={selectedType}
          handleClose={() => setRequestDialog(false)}
          onSuccess={() => {
            fetchFields();
            setRequestDialog(false);
          }}
        />
      )}
      {askSupplierPriceDialog && (
        <AskSupplierPriceDialog
          setAskSupplierPriceDialog={setAskSupplierPriceDialog}
          askSupplierPriceDialog={askSupplierPriceDialog}
          handelAskPriceToSupplier={handelAskPriceToSupplier}
          supplierContactData={supplierContactData}
          fields={allFields}
        />
      )}
      {leadTimeDialog.open && (
        <LeadTimeDialog
          quotationId={quotationData._id}
          data={leadTimeDialog?.data}
          versionId={versionId}
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setLeadTimeDialog({ open: false, data: null });
            fetchData();
          }}
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
    </Fragment>
  );
};

export default Productpackage;
