import { Box, Button, Dialog } from '@material-ui/core';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DownloadIcon, ExportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { CreateEmail } from '../Activity/Email/CreateEmail';
import { PreviewDialog } from './PreviewDialog';

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
  ccEmails = []
}) {
  const toastConfig = useContext(CustomToastContext);

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

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

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
    } else if (subType === 'Detail') {
      api = `/pdf/${referenceId}/detail?resource=${resource}&columns=${showColumns}`;
    } else {
      api = `/pdf/${referenceId}?resource=${resource}&columns=${showColumns}`;
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
    <Box display="flex" justifyContent="space-between">
      <Box display="flex" alignItems="center">
        <Box display="flex" flexWrap={'wrap'} gridGap={8}>
          <Button
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            className="btn-outline-v1"
            color="primary"
            type="button"
            size="small"
            startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
            disabled={loadingType === 'view'}
            onClick={(e) => {
              setShowColumnsDialog({ open: true, type: 'PDF', operation: 'Preview' });
            }}
          >
            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : loadingType === 'view' ? 'Please wait...' : 'Preview'}
          </Button>
          <Button
            className="btn-outline-v1"
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="primary"
            type="button"
            size="small"
            startIcon={isMobile && !isTablet ? '' : <DownloadIcon />}
            disabled={loadingType === 'download'}
            onClick={(e) => {
              setShowColumnsDialog({ open: true, type: 'PDF', operation: 'Download' });
            }}
          >
            {isMobile && !isTablet ? <DownloadIcon fontSize={20} /> : loadingType === 'download' ? 'Please wait...' : 'Download'}
          </Button>
          {isExcelDownload && (
            <Button
              className="btn-outline-v1"
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              type="button"
              size="small"
              startIcon={isMobile && !isTablet ? '' : <ExportIcon />}
              disabled={loadingType === 'excel'}
              onClick={(e) => {
                setShowColumnsDialog({ open: true, type: 'Excel', operation: 'Download' });
              }}
            >
              {isMobile && !isTablet ? <ExportIcon /> : loadingType === 'export' ? 'Please wait...' : 'Export To Excel'}
            </Button>
          )}
          {isSendEmail && (
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              size="small"
              className="btn-outline-v1"
              disabled={loadingType === 'email'}
              startIcon={isMobile ? '' : <MdEmail />}
              onClick={() => {
                setShowColumnsDialog({ open: true, type: isExcelDownload ? 'PDF-Excel' : 'PDF', operation: 'Send Email' });
              }}
            >
              {isMobile && !isTablet ? <MdEmail size={20} /> : loadingType === 'email' ? 'Please wait...' : `Send Email`}
            </Button>
          )}
        </Box>
      </Box>
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
          defaultColumns={defaultColumns}
          columns={columns}
          button1Title={button1Title}
          button2Title={button2Title}
          operation={showColumnsDialog.operation}
          isExcelDownload={isExcelDownload}
        />
      )}
      {sendEmail && (
        <Dialog
          open={sendEmail}
          fullScreen={fullScreen || isMobile || isTablet}
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
    </Box>
  );
}

export default PreviewDownload;
