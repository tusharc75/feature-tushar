import { Box, Dialog, IconButton } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaFileInvoice } from 'react-icons/fa';
import { FaFileZipper } from 'react-icons/fa6';
import { IoMdDownload } from 'react-icons/io';
import { useData } from 'src/StateProvider/Provider';
import { CancelInvoiceIcon } from 'src/assets/svg/svgIcons';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CommentDialog from 'src/components/CommentDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  CHILD_RESOURCE,
  CustomDialogTransition,
  INVOICE_STATUS,
  MATERIAL_TYPE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  invoice,
  sidebarResource
} from 'src/constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CreditMemo from '../CreditMemo';
import { FiExternalLink } from 'react-icons/fi';

const ViewInvoice = ({ invoiceId, onClose, onSuccess, resource }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(routes?.invoice.title)}_view`;

  const [columns, setColumns] = useState(null);
  const [commentDialog, setCommentDialog] = useState(false);

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [invoiceData, setInvoiceData] = useState(null);

  const [tabValue, setTabValue] = useState(0);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  const {
    state: { user, permissions }
  }: any = useData();

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    axiosInstance()
      .get(`${invoice.api}/${invoiceId}`)
      .then(({ data: { data } }) => {
        setInvoiceData(data);
        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.invoice, data));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceData) {
      fetchFields();
      fetchData();
    }
  }, [invoiceData]);

  const fetchFields = async () => {
    try {
      let data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, false);

      const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData.currency ? invoiceData.currency : 'USD');
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
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>{`${startCase(row.original?.type)} `}</p>
            </div>
          )
        },
        {
          accessor: 'detail',
          Header: 'Details',
          disabled: true,
          minWidth: 300,
          width: 300,
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
              {row.original['type'] !== MATERIAL_TYPE.manualEntry && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                    } else {
                      window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
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
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];

    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData?._id}`);
    data = response?.data?.data;

    const responseAdditionalCostData = await axiosInstance().get(`${invoice.api}/${invoiceData?._id}/additional-cost`);
    let additionalCostData = responseAdditionalCostData?.data?.data;

    const rows = data.material.filter((e) => !e.parentId);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === MATERIAL_TYPE.product
        ? parent.productDetail?.productName
        : parent.type === MATERIAL_TYPE.package
          ? parent.packageDetail?.packageName
          : parent.type === MATERIAL_TYPE.serializedAsset
            ? parent.serializedAssetDetail?.assetNumber
            : parent.serviceDetail?.serviceName
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === MATERIAL_TYPE.serializedAsset
                ? parent.serializedAssetDetail?.product?.productDescription || ''
                : '';
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (additionalCostData?.length > 0) {
      additionalCostData?.forEach((element) => {
        element.index = rows.length + 1;
        element.detail = element.description;
        element.description = element.description;
        element.type = 'manualEntry';
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
      _subRow.detail = `${_subRow?.type === MATERIAL_TYPE.product
        ? _subRow?.productDetail?.productName
        : _subRow?.type === MATERIAL_TYPE.package
          ? _subRow?.packageDetail?.packageName
          : _subRow?.type === MATERIAL_TYPE.serializedAsset
            ? _subRow?.serializedAssetDetail?.assetNumber
            : _subRow?.serviceDetail?.serviceName
        }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === MATERIAL_TYPE.serializedAsset
                ? _subRow.serializedAssetDetail?.product?.productDescription || ''
                : '';
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    axiosInstance()
      .get(`${invoice.api}/zip/${invoiceData?._id}`, {
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
      .patch(`${routes?.generateInvoice.path}/cancel`, {
        invoice: invoiceData?._id,
        comment: data,
        resource: resource
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

  const previewDownloadProps = {
    fileName: `${routes.invoice.title}-${invoiceData?.invoiceNumber}`,
    resource: sidebarResource.invoice,
    referenceId: invoiceData?._id,
    columns: columns,
    hideDetailButton: resource === sidebarResource.fieldTicket ? true : false,
    isSendEmail: true,
    defaultColumns: [
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
    ]
  };

  const leftSideContents = () => {
    return (
      <>
        {resource === sidebarResource.fieldTicket && (
          <>
            <ThemeButton
              iconForMobile={<FaFileZipper />}
              type="button"
              disabled={isDownloadingZip ? true : false}
              startIcon={isMobile ? '' : <IoMdDownload />}
              onClick={(e) => {
                handleDownloadZip();
              }}
              tooltip={isDownloadingZip ? 'Please wait...' : 'Save as Zip File'}
            >
              {isDownloadingZip ? 'Please wait...' : 'Save as Zip File'}
            </ThemeButton>
            <ThemeButton
              type="button"
              iconForMobile={<FaFileInvoice />}
              disabled={isDownloadingPdf ? true : false}
              startIcon={<IoMdDownload />}
              onClick={(e) => {
                handleDownloadPdf();
              }}
              tooltip={isDownloadingPdf ? 'Please wait...' : 'Download Invoice Tickets'}
            >
              {isDownloadingPdf ? 'Please wait...' : 'Download Invoice Tickets'}
            </ThemeButton>
          </>
        )}
      </>
    );
  };
  const rightSideContents = () => {
    return (
      <>
        {dataRows &&
          dataRows?.length > 0 &&
          permissions?.invoice?.isDelete &&
          checkIsAllowedToDelete(user, sidebarResource.invoice, invoiceData?.owner?.optionValue) &&
          [sidebarResource.fieldTicket, sidebarResource.repairOrder, sidebarResource.salesOrder]?.includes(resource) &&
          ![INVOICE_STATUS.closed, INVOICE_STATUS.cancelled]?.includes(invoiceData?.status) && (
            <ThemeButton
              iconForMobile={<CancelInvoiceIcon />}
              tooltip="Cancel Invoice"
              borderColor="red"
              mode="light"
              hasMobileBorder={false}
              onClick={() => setCommentDialog(true)}
            >
              Cancel Invoice
            </ThemeButton>
          )}
      </>
    );
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Invoice Number : ${invoiceData?.invoiceNumber}`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <DetailsPageHeader
              previewDownloadProps={previewDownloadProps}
              isActionButtonVisible={false}
              isAddButtonVisible={false}
              leftSideContents={leftSideContents()}
              rightSideContents={rightSideContents()}
              hasXpadding={false}
            />
            <Box pt={1}>
              {resource === sidebarResource.fieldTicket && permissions?.creditMemo?.isRead ? (
                <>
                  <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                    <CustomTab value={0} label={'Details'} />
                    <CustomTab value={1} label={routes.creditMemo.title} />
                  </CustomTabs>
                  <TabPanel value={tabValue} index={0}>
                    <Fragment>
                      {columns ? (
                        <Box zIndex={5} width={'100%'} pt={1}>
                          <CustomReactTable
                            height={'calc(100vh - 300px)'}
                            columns={columns}
                            state={state}
                            dispatch={dispatch}
                            hideSelection={true}
                            hideAction={true}
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchData}
                            isClientSideGrid={true}
                            expander={resource === sidebarResource.fieldTicket ? false : true}
                          />
                        </Box>
                      ) : (
                        <Box p={2} height={500}>
                          <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                      )}
                    </Fragment>
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <CreditMemo
                      invoiceData={invoiceData}
                      allowedToEdit={[INVOICE_STATUS.closed, INVOICE_STATUS.cancelled]?.includes(invoiceData?.status) ? false : allowedToEdit}
                    />
                  </TabPanel>
                </>
              ) : (
                <Fragment>
                  {columns ? (
                    <Box zIndex={5} width={'100%'} pt={1}>
                      <CustomReactTable
                        height={'calc(100vh - 250px)'}
                        columns={columns}
                        state={state}
                        dispatch={dispatch}
                        hideSelection={true}
                        hideAction={true}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                        refreshGrid={fetchData}
                        expander={resource === sidebarResource.fieldTicket ? false : true}
                      />
                    </Box>
                  ) : (
                    <Box p={2} height={500}>
                      <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                  )}
                </Fragment>
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
