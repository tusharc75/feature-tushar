import { Box, Button, Dialog, useMediaQuery } from '@material-ui/core';
import { useContext, useState } from 'react';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DownloadIcon, ExportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import { PreviewDialog } from './PreviewDialog';

export type PreviewDownloadProps = {
  resource: any;
  referenceId: any;
  columns: any;
  fileName: string;
  isSendEmail?: boolean;
  defaultColumns?: any[];
  hideDetailButton?: boolean;
  button1Title?: string;
  button2Title?: string;
  extraQueryParams?: any;
  subject?: string;
  isExcelDownload?: boolean;
  versionNumber?: any;
  handleRefresh?: any;
  toEmails?: any[];
  ccEmails?: any[];
  isAsyncDownload?: boolean;
  referenceLabel?: string;
};

function PreviewDownload({
  resource,
  referenceId,
  columns,
  fileName,
  isSendEmail = false,
  defaultColumns = [],
  hideDetailButton = false,
  button1Title = 'Regular',
  button2Title = 'Detail',
  extraQueryParams = null,
  subject = '',
  isExcelDownload = false,
  versionNumber = null,
  handleRefresh = null,
  toEmails = [],
  ccEmails = [],
  isAsyncDownload = false,
  referenceLabel = ''
}: PreviewDownloadProps) {
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:600px)');

  const allColumn =
    columns
      ?.filter((d) => !['Actions'].includes(d?.Header || d?.headerName))
      ?.map((d) => {
        return {
          fieldLabel: d?.Header || d?.headerName,
          fieldName: d?.accessor || d?.field
        };
      })
      ?.map((d) => {
        return { ...d, fieldName: d.fieldName === 'qtyDisplay' ? 'qty' : d.fieldName };
      }) || [];

  const [fullScreen, setFullScreen] = useState(isMobile);

  const [sendEmail, setSendEmail] = useState(false);

  const [showColumnsDialog, setShowColumnsDialog] = useState({ open: false, type: '', operation: '' });
  const [loadingType, setLoadingType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [emailAttachments, setEmailAttachments] = useState([]);

  const handleView = (type, operation, subType, visibleColumns) => {
    setLoadingType(subType);

    let showColumns = visibleColumns?.map((e) => e?.fieldName)?.toString();

    let api = '';
    if (type === 'Excel') {
      api = `/excel/${referenceId}?resource=${resource}&columns=${showColumns}`;
    } else {
      if (isAsyncDownload) {
        if (subType === 'Detail') {
          api = `/pdf/async-download/${referenceId}/detail?resource=${resource}&columns=${showColumns}&referenceLabel=${referenceLabel}`;
        } else {
          api = `/pdf/async-download/${referenceId}?resource=${resource}&columns=${showColumns}&referenceLabel=${referenceLabel}`;
        }
      } else {
        if (subType === 'Detail') {
          api = `/pdf/${referenceId}/detail?resource=${resource}&columns=${showColumns}`;
        } else {
          api = `/pdf/${referenceId}?resource=${resource}&columns=${showColumns}`;
        }
      }
    }
    if (extraQueryParams) {
      for (const key in extraQueryParams) {
        api = `${api}&${key}=${extraQueryParams[key]}`;
      }
    }

    const responseType = type === 'Excel' ? 'arraybuffer' : 'blob';

    axiosInstance()
      .get(api, { responseType: responseType })
      .then((response) => {
        setLoadingType(null);
        setLoading(false);
        if (isAsyncDownload) {
          toastConfig.setToastConfig({
            message: 'Document creation in process',
            open: true,
            type: 'success'
          });
        } else {
          setShowColumnsDialog({ open: false, type: '', operation: '' });
          let newFileName = fileName;
          if (subType !== '' && !hideDetailButton) {
            newFileName = `${newFileName}-${subType === 'Regular' ? button1Title : button2Title}`;
          }
          const contentType = type === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          const extension = type === 'PDF' ? 'pdf' : 'xlsx';

          if (type === 'PDF' && operation === 'Preview') {
            const blobData = new Blob([response.data], { type: contentType });
            const fileURL = URL.createObjectURL(blobData);
            const link = document.createElement('a');
            link.href = fileURL;
            link.target = '_blank';
            link.style.display = 'none';
            link.click();
            toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewed Successfully.' });
          } else if (operation === 'Download') {
            const blobData = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blobData);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${newFileName}.${extension}`);
            link.click();
            toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Downloaded Successfully.' });
          } else if (operation === 'base64') {
            const blobData = new Blob([response.data], { type: contentType });
            generateBase64forFile(blobData, newFileName, extension);
          }
        }
      })
      .catch((err) => {
        setLoadingType(null);
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, fileName, extension) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      const attachments = {
        base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
        contentType: base64data.split(';')[0].split(':')[1],
        extension: `.${extension}`,
        name: fileName
      };
      setEmailAttachments((prevState) => {
        return [...prevState, attachments];
      });
      setSendEmail(true);
    };
  };

  return (
    <>
      {
        <Button
          variant={isMobile ? 'text' : 'outlined'}
          className="btn-outline-v1  with-border"
          color="primary"
          type="button"
          size="small"
          startIcon={isMobile ? '' : <AiFillFilePdf />}
          disabled={loadingType === 'view'}
          onClick={(e) => {
            setShowColumnsDialog({ open: true, type: 'PDF', operation: 'Preview' });
          }}
        >
          {isMobile ? <AiFillFilePdf size={18} /> : loadingType === 'view' ? 'Please wait...' : 'Preview'}
        </Button>
      }
      <Button
        className="btn-outline-v1 with-border"
        variant={isMobile ? 'text' : 'outlined'}
        color="primary"
        type="button"
        size="small"
        startIcon={isMobile ? '' : <DownloadIcon />}
        disabled={loadingType === 'download'}
        onClick={(e) => {
          setShowColumnsDialog({ open: true, type: 'PDF', operation: 'Download' });
        }}
      >
        {isMobile ? <DownloadIcon fontSize={20} /> : loadingType === 'download' ? 'Please wait...' : 'Download'}
      </Button>
      {isExcelDownload && (
        <Button
          className="btn-outline-v1  with-border"
          variant={isMobile ? 'text' : 'outlined'}
          color="primary"
          type="button"
          size="small"
          startIcon={isMobile ? '' : <ExportIcon />}
          disabled={loadingType === 'excel'}
          onClick={(e) => {
            setShowColumnsDialog({ open: true, type: 'Excel', operation: 'Download' });
          }}
        >
          {isMobile ? <ExportIcon /> : loadingType === 'export' ? 'Please wait...' : 'Export To Excel'}
        </Button>
      )}
      {isSendEmail && (
        <Button
          variant={isMobile ? 'text' : 'outlined'}
          color="primary"
          size="small"
          className="btn-outline-v1  with-border"
          disabled={loadingType === 'email'}
          startIcon={isMobile ? '' : <MdEmail />}
          onClick={() => {
            if (isAsyncDownload) {
              setSendEmail(true);
            } else {
              setShowColumnsDialog({ open: true, type: isExcelDownload ? 'PDF-Excel' : 'PDF', operation: 'Send Email' });
            }
          }}
        >
          {isMobile ? <MdEmail size={20} /> : loadingType === 'email' ? 'Please wait...' : `Send Email`}
        </Button>
      )}

      {showColumnsDialog.open && (
        <PreviewDialog
          type={showColumnsDialog.type}
          handleClose={() => {
            setShowColumnsDialog({ open: false, type: '', operation: '' });
          }}
          handleView={(subType, visibleColumnsPdf, visibleColumnsExcel) => {
            if (showColumnsDialog.operation === 'Send Email') {
              setLoadingType('email');
              handleView('PDF', 'base64', 'Regular', visibleColumnsPdf);
              if (!hideDetailButton) {
                handleView('PDF', 'base64', 'Detail', visibleColumnsPdf);
              }
              if (isExcelDownload) {
                handleView('Excel', 'base64', '', visibleColumnsExcel);
              }
              setSendEmail(true);
            } else {
              handleView(
                showColumnsDialog.type,
                showColumnsDialog.operation,
                subType,
                showColumnsDialog.type === 'Excel' ? visibleColumnsExcel : visibleColumnsPdf
              );
            }
          }}
          loadingType={loadingType}
          loading={loading}
          hideDetailButton={hideDetailButton}
          allColumn={allColumn}
          resource={resource}
          referenceId={referenceId}
          defaultColumns={defaultColumns}
          columns={columns}
          button1Title={button1Title}
          button2Title={button2Title}
          operation={showColumnsDialog.operation}
          isExcelDownload={isExcelDownload}
          isAsyncDownload={isAsyncDownload}
        />
      )}
      {sendEmail && (
        <Dialog
          open={sendEmail}
          fullScreen={fullScreen || isMobile}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={() => {
            setSendEmail(false);
            setEmailAttachments([]);
            setFullScreen(false);
          }}
          fullWidth
        >
          <CreateEmail
            showESign={resource === sidebarResource.quoteBuilder ? true : false}
            generatingFile={false}
            handleClose={() => {
              setSendEmail(false);
              setEmailAttachments([]);
              setFullScreen(false);
            }}
            fetchData={() => {
              setSendEmail(false);
              setEmailAttachments([]);
              if (handleRefresh) {
                handleRefresh();
              }
            }}
            id={referenceId}
            isQuoteBuilder={true}
            emailId={null}
            qouteBuilderAttachments={emailAttachments}
            subject={subject}
            fromQuote={true}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            referenceType={resource}
            versionNumber={versionNumber}
            options={toEmails}
            cc={ccEmails}
          />
        </Dialog>
      )}
    </>
  );
}

export default PreviewDownload;
