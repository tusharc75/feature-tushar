import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, capitalize, Chip, CircularProgress, Dialog, IconButton, makeStyles, Menu, MenuItem, TextField } from '@material-ui/core';
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
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import PreviewDownload from 'src/components/PreviewDownload';
import { generateCustomTableColumns } from 'src/constants/columns';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  }
}));

const ViewInvoice = ({ invoiceData, estimateStartDate, onClose, onSuccess }) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const renderedFrom = 'view_invoice';

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [cancelInvoice, setCancelInvoice] = useState({ open: false, isUpdating: false, message: null });

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    try {
      let data = await fetch_invoice_product_fields(invoiceData?.currency);
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
      const newColumns = generateCustomTableColumns(data, invoiceData?.currency, renderedFrom);
      let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
      if (qtyIndex > -1) {
        newColumns[qtyIndex].accessor = 'qtyDisplay';
      }
      var column: any = [
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
          Header: 'Details',
          minWidth: 300,
          width: 300,
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
                ? parent.serializedAssetDetail?.product?.productDescription || ''
                : '';
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (additionalCostData?.length > 0) {
      additionalCostData?.forEach((element) => {
        element.index = rows.length + 1;
        element.detail = element.description;
        element.description = element.description;
        element.type = 'manualEntry';
        element.qtyDisplay = element.qty;
        element.parentId = null;
        rows.push(element);
      });
    }
    setRowsData(rows);
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
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleCancelInvoice = async () => {
    if (cancelInvoice.message) {
      setCancelInvoice((prevState) => ({ ...prevState, isUpdating: true }));

      axiosInstance().patch(`${routes?.fieldTicketInvoice.path}/status`, {
        status: 'Cancelled',
        invoice: invoiceData?._id,
        fieldTicket: invoiceData?.id,
        message: cancelInvoice.message
      })
        .then(({ data }) => {
          setCancelInvoice({ open: false, isUpdating: false, message: null });
          onSuccess();
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
        })
        .catch((error) => {
          setCancelInvoice((prevState) => ({ ...prevState, isUpdating: false }));
          toastConfig.setToastConfig(error);
        });
    }
  }


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
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  setCancelInvoice({ open: true, isUpdating: false, message: null })
                }}
              >
                Cancel Invoice
              </Button>
            </Box>
            {columns && rowsData ? (
              <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={columns}
                  data={rowsData}
                  onSelect={() => { }}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  hideSelection={true}
                  hideAction={true}
                  renderedFrom={renderedFrom}
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

      {cancelInvoice.open && (
        <Dialog
          open
          classes={{
            paper: classes.paper
          }}
          onClose={() => setCancelInvoice((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
        >
          <CustomDialogHeader
            title="Are you sure ?"
            showRequiredLabel={false}
            onClose={() => setCancelInvoice((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
          />
          <CustomDialogContent>
            <Box className="my-2">
              <TextField
                id="outlined-multiline-static"
                label={`Please enter the reason for cancel Invoice`}
                multiline
                required
                fullWidth
                rows={4}
                value={cancelInvoice.message}
                variant="outlined"
                error={!cancelInvoice.message}
                helperText={!cancelInvoice.message && "Comment is Required !!"}
                onChange={(e) => {
                  setCancelInvoice((prevState) => ({ ...prevState, message: e.target.value }));
                }}
              />
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button size="small" variant="outlined" color="primary" onClick={() => setCancelInvoice((prevState) => ({ ...prevState, open: false }))}>
              Cancel
            </Button>
            <Button size="small" onClick={handleCancelInvoice} disabled={cancelInvoice.isUpdating} variant="contained" color="primary">
              {cancelInvoice.isUpdating ? <CircularProgress style={{ marginRight: '8px' }} size={20} color="inherit" /> : null}
              Confirm
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
    </Fragment>
  );
};

export default ViewInvoice;
