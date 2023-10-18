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
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import { camelCase, startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PreviewDownload from 'src/components/PreviewDownload';
import { generateCustomTableColumns } from 'src/constants/columns';
import CommentDialog from 'src/components/CommentDialog';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { IoMdDownload } from 'react-icons/io';
import TabPanel from 'src/components/TabPanel';
import Invoices from './Invoices';
import CreditMemo from './CreditMemo';

const ViewInvoice = ({ invoiceData, onClose, onSuccess, resource }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(routes?.invoice.title)}_view`;

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [commentDialog, setCommentDialog] = useState(false);

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [tabValue, setTabValue] = useState(0);



  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
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
                  {resource === sidebarResource.fieldTicketInvoice &&
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
                  }
                </Box>
              )}
              <div className="ml-auto">
                {rowsData && rowsData?.length > 0 && resource === sidebarResource.fieldTicketInvoice &&
                  <DeleteButton text="Cancel Invoice" onClick={() => setCommentDialog(true)} />}
              </div>
            </div>
            <div>
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
                  label={
                    <div className="d-flex align-items-center tab-font">
                      Details
                    </div>
                  }
                  value={0}
                  aria-controls="a11y-tabpanel-0"
                  id="a11y-tab-0"
                />
                <Tab
                  className={'tabLayout'}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      Credit Memo
                    </div>
                  }
                  value={1}
                  aria-controls="a11y-tabpanel-1"
                  id="a11y-tab-1"
                />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Invoices
                  invoiceData={invoiceData}
                  onSuccess={onSuccess}
                  setInvoices={setRowsData}
                />
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <CreditMemo invoiceData={invoiceData} />
              </TabPanel>
            </div>
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
    </Fragment>
  );
};

export default ViewInvoice;
