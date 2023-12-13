import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton, Menu, MenuItem } from '@material-ui/core';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, invoice, rentalManagement, sidebarResource } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import { Delete, ExpandMore } from '@material-ui/icons';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import { camelCase, startCase } from 'lodash';
import EditIcon from '@material-ui/icons/Edit';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import PreviewDownload from 'src/components/PreviewDownload';

const ViewBillingDialog = ({ rentalManagementData, invoiceData, onClose, onSuccess }) => {
  const renderedFrom = `${camelCase(routes?.rentalManagementInvoice.title)}_view_invoice`;

  const toastConfig = useContext(CustomToastContext);

  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });
  const [viewBillDialogConfirm, setViewBillDialogConfirm] = useState({ open: false, rows: [] });
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();


  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (columns) {
      fetchData();
    }
  }, [columns]);

  const fetchFields = async () => {
    try {
      let data = await fetch_invoice_product_fields(invoiceData?.currency);
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
      const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData?.currency);
      let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
      if (qtyIndex > -1) {
        newColumns[qtyIndex].accessor = 'qtyDisplay';
      }
      var column: any = [
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
          width: 200,
          disableFilters: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          disabled: true,
          Cell: ({ row }) =>
            row.original['type'] ? (
              <p>
                {`${startCase(row.original?.type)} `}
                {row.original['type'] === 'product'
                  ? row.original?.productDetail?.serializedProduct
                    ? '(Serialized)'
                    : '(Non-Serialized)'
                  : row.original?.type === 'package'
                    ? row.original?.packageDetail.packageType === 'Product'
                      ? '(Product)'
                      : '(Service)'
                    : row.original.type === 'service'
                      ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                      : ''}
              </p>
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'detail',
          Header: 'Details',
          minWidth: 300,
          disabled : true,
          width: 300,
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
              {row.original['type'] !== 'manualEntry' && (
                <Box ml={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (row.original.type === 'service') {
                        window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                      } else if (row.original.type === 'product') {
                        window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                      } else if (row.original.type === 'serializedAsset') {
                        window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                      } else {
                        window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                      }
                    }}
                  >
                    <OpenInNewIcon fontSize="small" color="primary" />
                  </IconButton>
                </Box>
              )}
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
        Cell: ({ row }) => (
          <Grid container spacing={1}>
            {row.original.isEditable && row.original.qty > 1 && (
              <>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setIsProductEdit({ open: true, rowData: row.original });
                  }}
                >
                  <EditIcon color="primary" />
                </IconButton>
                <Box ml={1} />
              </>
            )}
            <IconButton
              disabled={!invoiceData?.isLatestInvoice}
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                getNestedSubRows(obj, row.original);
                setViewBillDialogConfirm({ open: true, rows: obj });
              }}
            >
              <Delete color={invoiceData?.isLatestInvoice ? 'error' : 'disabled'} />
            </IconButton>
          </Grid>
        )
      });
      setColumns(column);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    data = response?.data?.data;

    const responseAdditionalCostData = await axiosInstance().get(`${invoice.api}/${invoiceData._id}/additional-cost`);
    let additionalCostData = responseAdditionalCostData?.data?.data;

    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === 'product'
        ? parent.productDetail?.productName
        : parent.type === 'package'
          ? parent.packageDetail?.packageName
          : parent.type === 'serializedAsset'
            ? parent.serializedAssetDetail?.assetNumber
            : parent.serviceDetail?.serviceName
        }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === 'serializedAsset'
                ? `${parent.serializedAssetDetail?.product?.optionLabel}-${parent.serializedAssetDetail?.product?.productDescription || ''}`
                : '';
      parent.isEditable = ['Per Day', 'Per Week', 'Per Month'].includes(parent?.pricingMethod) ? false : true;
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (additionalCostData?.length > 0) {
      additionalCostData?.forEach((element) => {
        element.index = rows.length + 1;
        element.detail = element.costType;
        element.type = 'manualEntry';
        element.qtyDisplay = element.qty;
        element.materialId = element?._id;
        element.parentId = null;
        rows.push(element);
      });
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow?.type === 'product'
        ? _subRow?.productDetail?.productName
        : _subRow?.type === 'package'
          ? _subRow?.packageDetail?.packageName
          : _subRow?.type === 'serializedAsset'
            ? _subRow?.serializedAssetDetail?.assetNumber
            : _subRow?.serviceDetail?.serviceName
        }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === 'serializedAsset'
                ? _subRow.serializedAssetDetail?.product?.productDescription || ''
                : '';
      _subRow.isEditable = false;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSaveData = async (rows: any) => {
    const data = {
      invoiceId: invoiceData?._id,
      materialId: rows[0]?.materialId,
      qty: rows[0]?.qty
    };
    setIsLoadingUpdate(true);
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing/update-qty`, data)
      .then((res) => {
        setIsLoadingUpdate(false);
        setIsProductEdit({ open: false, rowData: null });
        fetchData();
        onSuccess();
      })
      .catch((error) => {
        setIsLoadingUpdate(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteData = async (rows) => {
    const data = {
      invoiceId: invoiceData?._id,
      materialIds: rows?.map((e) => e.materialId) || []
    };
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing/remove`, data)
      .then((res) => {
        fetchData();
        setViewBillDialogConfirm({ open: false, rows: [] });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Invoice Number : ${invoiceData?.invoiceNumber}`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <Box display="flex" justifyContent="space-between" p={1}>
              {invoiceData && (
                <PreviewDownload
                  fileName={`${routes.invoice.title}-${invoiceData?.invoiceNumber}`}
                  resource={sidebarResource.invoice}
                  referenceId={invoiceData?._id}
                  columns={columns}
                  isSendEmail={true}
                />
              )}
              <Box display="flex" alignItems="center">
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={handleClick}
                  aria-controls="action-menu"
                  disabled={selectedRecords?.length && invoiceData?.isLatestInvoice ? false : true}
                  endIcon={<ExpandMore />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  id="action-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      const obj: any = [];
                      selectedRecords?.forEach((ele) => {
                        obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
                      });
                      selectedRecords?.forEach((ele) => {
                        getNestedSubRows(obj, ele);
                      });
                      setViewBillDialogConfirm({ open: true, rows: obj });
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
            {columns ? (
              <CustomReactTable
                height={'calc(100vh - 250px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                hideSelection={false}
                hideAction={false}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                expander={true}
              />
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Fragment>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
        </CustomDialogFooter>
      </Dialog>
      {isProductEdit.open && (
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, rowData: null });
          }}
          isBulkedit={false}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={dataRows?.find((d) => d._id === isProductEdit.rowData._id)}
          material={material}
          selectedProducts={[]}
          loading={isLoadingUpdate}
          isQtyOnly={true}
        />
      )}
      {viewBillDialogConfirm.open ? (
        <ConfirmationDialog
          open={viewBillDialogConfirm.open}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setViewBillDialogConfirm({ open: false, rows: [] });
          }}
          okBtnLoading={null}
          onOk={() => {
            handleDeleteData(viewBillDialogConfirm.rows);
          }}
        />
      ) : null}
    </Fragment>
  );
};

export default ViewBillingDialog;
