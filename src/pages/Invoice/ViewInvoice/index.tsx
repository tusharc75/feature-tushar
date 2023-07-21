import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, capitalize, Chip, CircularProgress, Dialog, IconButton, Menu, MenuItem } from '@material-ui/core';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, dateFormat, formatAmountWithCurrency, invoice, pricingCondition, rentalManagement, sidebarResource } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Add, Delete, Edit, ExpandMore } from '@material-ui/icons';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import { startCase } from 'lodash';
import EditIcon from '@material-ui/icons/Edit';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import PreviewDownload from 'src/components/PreviewDownload';
import { generateCustomTableColumns } from 'src/constants/columns';

const ViewInvoice = ({ pageData = null, invoiceData, estimateStartDate, onClose, onSuccess }) => {

  const toastConfig = useContext(CustomToastContext);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [allFields, setAllFields] = useState([]);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });
  const [viewBillDialogConfirm, setViewBillDialogConfirm] = useState({ open: false, rows: [] });

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    try {
      let data = await fetch_invoice_product_fields(invoiceData?.currency);
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
      setAllFields(JSON.parse(JSON.stringify(data)));
      const newColumns = generateCustomTableColumns(data, invoiceData?.currency, 'field_ticket_view_billing');
      let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
      if (qtyIndex > -1) {
        newColumns[qtyIndex].accessor = 'qtyDisplay';
      }
      var column: any = [
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
          width: 200,
          disableFilters: true,
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
          width: 300,
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
              {row.original['type'] !== 'additionalCost' && (
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
      pageData && column.push({
        accessor: 'action',
        Header: 'Action',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }) => (
          <Grid container spacing={1}>
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
      })
      setColumns(column);
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    data = response?.data?.data;

    const responseAdditionalCostData = await axiosInstance().get(`${invoice.api}/${invoiceData._id}/additional-cost`);
    let additionalCostData = responseAdditionalCostData?.data?.data;

    const rows = data.material.filter((e) => !e.parentId);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
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
                ? parent.serializedAssetDetail?.product?.productDescription || ''
                : '';
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (additionalCostData?.length > 0) {
      additionalCostData?.forEach((element) => {
        element.srno = rows.length + 1;
        element.detail = element.costType;
        element.type = 'additionalCost';
        element.qtyDisplay = element.qty;
        element.materialId = element?._id;
        element.parentId = null;
        rows.push(element);
      });
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
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


  const handleDeleteData = async (rows) => {
    const data = {
      invoiceId: invoiceData?._id,
      materialIds: rows?.map((e) => e.materialId) || []
    };
    axiosInstance()
      .put(`${rentalManagement.api}/${pageData._id}/progressive-billing/remove`, data)
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
              {invoiceData &&
                <PreviewDownload
                  resource={sidebarResource.invoice}
                  referenceId={invoiceData?._id}
                  columns={columns}
                  isSendEmail={true}
                />
              }
              <Box display="flex" alignItems="center">
                {pageData &&
                  <Button
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={handleClick}
                    aria-controls="action-menu"
                    disabled={selectedProducts?.length ? false : true}
                    endIcon={<ExpandMore />}
                    className="new-dropdown-v1"
                  >
                    Actions
                  </Button>}
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
                    disabled={!pageData ? true : false}
                    onClick={() => {
                      setAnchorEl(null);
                      const obj: any = [];
                      selectedProducts?.forEach((ele) => {
                        obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
                      });
                      selectedProducts?.forEach((ele) => {
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
            {columns && rowsData ? (
              <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={columns}
                  data={rowsData}
                  onSelect={setSelectedProducts}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  hideSelection={!pageData ? true : false}
                  hideAction={!pageData ? true : false}
                  renderedFrom="view_billing"
                  isClientSideGrid={true}
                  hideExpander={true}
                />
              </Box>
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

export default ViewInvoice;
