import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import { Button, Chip, Dialog, Grid } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, purchaseOrder, customerAccount, supplierAccount, quotation } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { IoMdDownload } from 'react-icons/io';

const SendEmail = ({ quotationData, versionData, isSendEmail = false, previewOnly = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [pdfFileBase64, setPdfFileBase64] = useState(null);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    fetchEmailsData();
  }, []);

  const fetchEmailsData = () => {
    let ownerCollaboratorEmails = [];
    if (quotationData?.collaborator && quotationData.collaborator.length) {
      ownerCollaboratorEmails = quotationData.collaborator.filter((o) => o?.email).map((o) => o?.email);
    }
    if (quotationData?.owner?.email) {
      ownerCollaboratorEmails.push(quotationData.owner.email);
    }
    let toEmails = [];
    if (quotationData?.supplier?.email) {
      toEmails.push(quotationData.supplier.email);
    }
    setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
  };

  let attachments = [];
  if (pdfFileBase64) {
    attachments.push({
      base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(',') + 1)),
      contentType: pdfFileBase64.split(';')[0].split(':')[1],
      name: `Purchase Order-${quotationData.quotationNumber}`
    });
  }

  const fetchEmailAttachment = () => {
    axiosInstance()
      .get(`${quotation.api}/${quotationData?._id}/pdf/${versionData._id}`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            const file = new Blob([data], { type: 'application/pdf' });
            generateBase64forFile(file, 'pdf');
          })
          .catch((err) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'error',
              message: 'PDF generating error'
            });
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, type) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data = reader.result;
      if (type === 'pdf') {
        setPdfFileBase64(base64data);
        setSendEmail(true);
        setLoading(null);
      }
    };
  };

  const onSendEmailSuccess = () => {
    setSendEmail(false);
    handleAttachments();
  };

  const handleViewPdf = (download) => {
    if (download) {
      setLoading('download');
    } else {
      setLoading('view');
    }
    axiosInstance()
      .get(`${quotation.api}/${quotationData?._id}/pdf/${versionData._id}`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            setLoading(null);
            if (download) {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Quotation-${quotationData.quotationNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
            } else {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
            }
          })
          .catch((err) => {
            setLoading(null);
            toastConfig.setToastConfig(err);
          });
      })
      .catch((err) => {
        setLoading(null);
        toastConfig.setToastConfig(err);
      });
  };

  const handleAttachments = () => {
    let request;
    request = {
      name: 'Quote',
      fileUrl: '',
      relatedTo: [
        {
          type: purchaseOrder.resource,
          referenceId: quotationData?._id,
          access: true
        },
        {
          type: quotationData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
          referenceId: quotationData?.customerAccountName
            ? quotationData?.customerAccountName?.optionValue
            : quotationData?.supplierAccountName?.optionValue,
          access: false
        }
      ]
    };
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box display="flex">
            <Box mx={1} />
            <Button
              variant="outlined"
              className="btn-outline-v1"
              type="button"
              size="small"
              startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
              disabled={loading === 'view'}
              onClick={() => {
                handleViewPdf(false);
              }}
            >
              {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : loading === 'view' ? 'Please wait...' : 'Preview'}
            </Button>
            <Box mx={1} />
            {!previewOnly && <Button
              variant="outlined"
              className="btn-outline-v1"
              type="button"
              size="small"
              startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
              disabled={loading === 'download'}
              onClick={() => {
                handleViewPdf(true);
              }}
            >
              {isMobile && !isTablet ? <IoMdDownload size={20} /> : loading === 'download' ? 'Please wait...' : 'Download'}
            </Button>}
            <Box mx={1} />
            {isSendEmail && permissions?.purchaseOrder?.isRead && <Button
              variant="outlined"
              className="btn-outline-v1"
              size="small"
              disabled={loading === "email"}
              startIcon={isMobile ? '' : <MdEmail />}
              onClick={() => {
                setLoading("email")
                fetchEmailAttachment()
              }}
            >
              {isMobile && !isTablet ? <MdEmail size={20} /> : loading === "email" ? "Please wait..." : `Send Email`}
            </Button>}
          </Box>
        </Box>
      </Box>
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
            fetchData={onSendEmailSuccess}
            id={quotationData._id}
            isQuoteBuilder={true}
            options={userEmails?.to}
            cc={userEmails?.cc ?? []}
            emailId={null}
            qouteBuilderAttachments={attachments}
            subject={`${user?.user?.brandName ?? 'Brand'} Offer - ${quotationData?.quotationNumber ?? ''}`}
            fromQuote={true}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            refrenceType="quotation"
          />
        </Dialog>
      )}
    </>
  );
};

export default SendEmail;
