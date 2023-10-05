import { Box, Button, Dialog } from '@material-ui/core';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillFilePdf } from 'react-icons/ai';

import { MdEmail } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DownloadIcon, ExportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, downloadExcel } from 'src/constants/helpers';
import { CreateEmail } from '../Activity/Email/CreateEmail';
import { PreviewDialog } from './PreviewDialog';

function PreviewDownload({
  resource,
  referenceId,
  columns,
  isSendEmail = false,
  defaultColumns = [],
  hideDetailButton = false,
  button1Title = 'Regular',
  button2Title = 'Detail',
  extraQueryParams = null,
  subject = '',
  isExcelDownload = false
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
  const [downlodingFile, setDownlodingFile] = useState(null);
  const [showColumnsDialog, setShowColumnsDialog] = useState({ open: false, type: '' });
  const [loadingType, setLoadingType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [emailAttachments, setEmailAttachments] = useState([]);

  const handleViewPdf = (type, pdfType, visibleColumns) => {
    setLoadingType(pdfType);

    // let showColumns = allColumn
    //   ?.filter((d) => visibleColumns?.includes(d?.fieldLabel))
    //   .map((d) => {
    //     return d?.fieldName;
    //   });

    let showColumns = visibleColumns?.map((d) => {
      return allColumn?.find((c) => c?.fieldLabel === d)?.fieldName;
    });

    let api = '';
    if (type === 'Export') {
      api = `/excel/${referenceId}?resource=${resource}&columns=${showColumns}`;
    } else if (pdfType === 'Detail') {
      api = `/pdf/${referenceId}/detail?resource=${resource}&columns=${showColumns}`;
    } else {
      api = `/pdf/${referenceId}?resource=${resource}&columns=${showColumns}`;
    }

    if (extraQueryParams) {
      for (const key in extraQueryParams) {
        api = `${api}&${key}=${extraQueryParams[key]}`;
      }
    }

    const responseType = type === 'Export' ? 'arraybuffer' : 'blob';
    axiosInstance()
      .get(api, { responseType: responseType })
      .then((response) => {
        setLoadingType(null);
        setLoading(false);
        setShowColumnsDialog({ open: false, type: '' });

        if (type === 'Export') {
          const fileName = `${resource}.xlsx`;
          downloadExcel(response.data, fileName);
        } else if (type === 'Download') {
          const blobData = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${resource}.pdf`);
          link.click();
        } else if (type === 'Preview') {
          const blobData = new Blob([response.data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = fileURL;
          link.target = '_blank';
          link.style.display = 'none';
          link.click();
          toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
        } else {
          const blobData = new Blob([response.data], { type: 'application/pdf' });
          generateBase64forFile(blobData, 'pdf', pdfType);
        }
      })
      .catch((err) => {
        setLoadingType(null);
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, type, pdfType) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      if (type === 'pdf') {
        const attachments = {
          base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
          contentType: base64data.split(';')[0].split(':')[1],
          extension: '.pdf',
          name: `${resource}-${pdfType}`
        };
        setEmailAttachments((prevState) => {
          return [...prevState, attachments];
        });
        setSendEmail(true);
      }
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
              setDownlodingFile('Preview');
              setShowColumnsDialog({ open: true, type: 'PDF' });
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
              setDownlodingFile('Download');
              setShowColumnsDialog({ open: true, type: 'PDF' });
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
                setDownlodingFile('Export');
                setShowColumnsDialog({ open: true, type: 'Excel' });
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
                setLoadingType('email');
                handleViewPdf('Email', 'Detail', columns);
                if (!hideDetailButton) {
                  handleViewPdf('Email', 'Regular', columns);
                }
                setSendEmail(true);
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
            setShowColumnsDialog({ open: false, type: '' });
          }}
          handleViewPdf={(type, visibleColumnsPdf) => {
            handleViewPdf(downlodingFile, type, visibleColumnsPdf);
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
          downlodingFile={downlodingFile}
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
            generatingFile={false}
            handleClose={() => {
              setSendEmail(false);
              setEmailAttachments([]);
              setFullScreen(false);
            }}
            fetchData={() => {
              setSendEmail(false);
              setEmailAttachments([]);
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
          />
        </Dialog>
      )}
    </Box>
  );
}

export default PreviewDownload;
