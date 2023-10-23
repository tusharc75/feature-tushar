import { useState, useEffect, useContext, Fragment } from 'react';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Grid, Dialog, IconButton, Tabs, Tab } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, INVOICE_STATUS, invoice, sidebarResource } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { camelCase, startCase } from 'lodash';
import PreviewDownload from 'src/components/PreviewDownload';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { IoMdDownload } from 'react-icons/io';
import TabPanel from 'src/components/TabPanel';
import CreditMemo from '../CreditMemo';
import CommentDialog from 'src/components/CommentDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import { generateCustomTableColumns } from 'src/constants/columns';
import { useData } from 'src/StateProvider/Provider';

const ViewInvoice = ({ invoiceData, onClose, onSuccess, resource }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(routes?.invoice.title)}_view`;

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [commentDialog, setCommentDialog] = useState(false);

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [tabValue, setTabValue] = useState(0);
  const {
    state: { permissions }
  }: any = useData();

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

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
      let qtyIndex = newColumns?.findIndex((d) => d.accessor === 'qty');
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
      parent.detail = `${
        parent.type === 'product'
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
      _subRow.detail = `${
        _subRow?.type === 'product'
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

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    axiosInstance()
      .get(`${invoice.api}/zip/${invoiceData._id}`, {
        responseType: 'blob'
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = response.headers['content-disposition'].split('filename=')[1];
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        setIsDownloadingZip(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloadingZip(false);
      });
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    axiosInstance()
      .get(`${invoice.api}/zip/pdf/${invoiceData._id}`, {
        responseType: 'blob'
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = response.headers['content-disposition'].split('filename=')[1];
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        setIsDownloadingPdf(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloadingPdf(false);
      });
  };

  const handleCancelInvoice = async (data) => {
    axiosInstance()
      .patch(`${routes?.fieldTicketInvoice.path}/invoice/cancle`, {
        invoice: invoiceData?._id,
        fieldTicket: invoiceData?.id,
        comment: data
      })
      .then(({ data }) => {
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const Invoice = () => {
    return (
      <Fragment>
        {columns && rowsData ? (
          <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} pt={1}>
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              data={rowsData}
              onSelect={() => {}}
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
    );
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Invoice Number : ${invoiceData?.invoiceNumber}`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <div className="flex flex-wrap gap-2 mb-2">
              {invoiceData && (
                <Box className="flex flex-wrap gap-2">
                  <PreviewDownload
                    fileName={`${routes.invoice.title}-${invoiceData?.invoiceNumber}`}
                    resource={sidebarResource.invoice}
                    referenceId={invoiceData?._id}
                    columns={columns}
                    hideDetailButton={true}
                    isSendEmail={true}
                    defaultColumns={[
                      'type',
                      'detail',
                      'fieldTicket',
                      'qty',
                      'unit',
                      'pricingMethod',
                      'actualStartDate',
                      'actualEndDate',
                      `price_${invoiceData?.currency?.toLowerCase()}`,
                      `totalPrice_${invoiceData?.currency?.toLowerCase()}`,
                      `taxPercentage`,
                      `tax_${invoiceData?.currency?.toLowerCase()}`,
                      `finalPrice_${invoiceData?.currency?.toLowerCase()}`
                    ]}
                  />
                  {resource === sidebarResource.fieldTicketInvoice && (
                    <>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'outlined'}
                        className="btn-outline-v1"
                        type="button"
                        size="small"
                        disabled={isDownloadingZip ? true : false}
                        startIcon={isMobile ? '' : <IoMdDownload />}
                        onClick={(e) => {
                          handleDownloadZip();
                        }}
                      >
                        {isMobile && !isTablet ? <IoMdDownload size={20} /> : isDownloadingZip ? 'Please wait...' : 'Save as Zip File'}
                      </Button>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'outlined'}
                        className="btn-outline-v1"
                        type="button"
                        size="small"
                        disabled={isDownloadingPdf ? true : false}
                        startIcon={isMobile ? '' : <IoMdDownload />}
                        onClick={(e) => {
                          handleDownloadPdf();
                        }}
                      >
                        {isMobile && !isTablet ? <IoMdDownload size={20} /> : isDownloadingPdf ? 'Please wait...' : 'Download Invoice Tickets'}
                      </Button>
                    </>
                  )}
                </Box>
              )}
              <div className="ml-auto">
                {rowsData && rowsData?.length > 0 && resource === sidebarResource.fieldTicketInvoice && (
                  <DeleteButton text="Cancel Invoice" onClick={() => setCommentDialog(true)} />
                )}
              </div>
            </div>
            <Box pt={1}>
              {resource === sidebarResource.fieldTicketInvoice && permissions?.creditMemo?.isRead ? (
                <>
                  <Tabs
                    className="new-tab-container-v1"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        height: 0
                      }
                    }}
                  >
                    <Tab
                      className={'tabLayout'}
                      label={<div className="d-flex align-items-center tab-font">Details</div>}
                      value={0}
                      aria-controls="a11y-tabpanel-0"
                      id="a11y-tab-0"
                    />
                    <Tab
                      className={'tabLayout'}
                      label={<div className="d-flex align-items-center tab-font">Credit Memo</div>}
                      value={1}
                      aria-controls="a11y-tabpanel-1"
                      id="a11y-tab-1"
                    />
                  </Tabs>
                  <TabPanel value={tabValue} index={0}>
                    <Invoice />
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <CreditMemo invoiceData={invoiceData} />
                  </TabPanel>
                </>
              ) : (
                <Invoice />
              )}
            </Box>
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
      {commentDialog && (
        <CommentDialog
          required={true}
          handleSubmit={(data) => {
            handleCancelInvoice(data);
            setCommentDialog(false);
          }}
          handleClose={() => {
            setCommentDialog(false);
          }}
        />
      )}
    </Fragment>
  );
};

export default ViewInvoice;
