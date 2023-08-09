import { Box, Button, Dialog} from '@material-ui/core';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition } from 'src/constants/helpers';
import { MdEmail } from 'react-icons/md';
import { CreateEmail } from '../Activity/Email/CreateEmail';
import { PreviewDialog } from './PreviewDialog';

function PreviewDownload({ resource, referenceId, columns, isSendEmail = false, defaultColumns = [], hideDetailButton = false }) {
  const toastConfig = useContext(CustomToastContext);

  const allColumn =
    columns
      ?.filter((d) => !['Actions'].includes(d?.Header || d?.headerName))
      ?.map((d) => {
        return {
          fieldLabel: d?.Header || d?.headerName,
          fieldName: d?.accessor || d?.field
        };
      }) || [];

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [sendEmail, setSendEmail] = useState(false);
  const [downlodingFile, setDownlodingFile] = useState(null);
  const [showColumnsDialog, setShowColumnsDialog] = useState({ open: false, type: '' });
  const [loadingType, setLoadingType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [emailAttachments, setEmailAttachments] = useState([]);

  const handleViewPdf = (type, pdfType, visibleColumns) => {
    let showColumns = allColumn
      ?.filter((d) => visibleColumns?.includes(d?.fieldLabel))
      .map((d) => {
        let k = d?.fieldName;
        if (k === 'qtyDisplay') {
          return 'qty';
        }
        return k;
      });
    setLoadingType(pdfType);
    axiosInstance()
      .get(
        pdfType === 'Detail'
          ? `/pdf/${referenceId}/detail?resource=${resource}&columns=${showColumns}`
          : `/pdf/${referenceId}?resource=${resource}&columns=${showColumns}`
      )
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            setLoadingType(null);
            setLoading(false);
            setShowColumnsDialog({ open: false, type: '' });
            if (type === 'Download') {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `${resource}.pdf`);
              document.body.appendChild(link);
              link.click();
            } else if (type === 'Preview') {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
            } else {
              const file = new Blob([data], { type: 'application/pdf' });
              generateBase64forFile(file, 'pdf', pdfType);
            }
          })
          .catch((err) => {
            setLoadingType(null);
            toastConfig.setToastConfig(err);
          });
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
            variant="outlined"
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
            variant="outlined"
            color="primary"
            type="button"
            size="small"
            startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
            disabled={loadingType === 'download'}
            onClick={(e) => {
              setDownlodingFile('Download');
              setShowColumnsDialog({ open: true, type: 'PDF' });
            }}
          >
            {isMobile && !isTablet ? <IoMdDownload size={20} /> : loadingType === 'download' ? 'Please wait...' : 'Download'}
          </Button>
          {isSendEmail && (
            <Button
              variant="outlined"
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
            setFullScreen(false);
          }}
          fullWidth
        >
          <CreateEmail
            generatingFile={false}
            handleClose={() => {
              setSendEmail(false);
              setFullScreen(false);
            }}
            fetchData={() => {
              setSendEmail(false);
            }}
            id={referenceId}
            isQuoteBuilder={true}
            emailId={null}
            qouteBuilderAttachments={emailAttachments}
            subject={``}
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
