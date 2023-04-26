import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import { Button, Chip, Dialog, Grid, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, purchaseOrder, customerAccount, supplierAccount } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { IoMdDownload } from 'react-icons/io';

const SendEmail = ({ purchaseOrderData }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [pdfFileBase64, setPdfFileBase64] = useState(null);
  const [loading, setLoading] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [downlodingFile, setDownlodingFile] = useState(null);

  useEffect(() => {
    fetchEmailsData();
  }, []);

  const fetchEmailsData = () => {
    let ownerCollaboratorEmails = [];
    if (purchaseOrderData?.collaborator && purchaseOrderData.collaborator.length) {
      ownerCollaboratorEmails = purchaseOrderData.collaborator.filter((o) => o?.email).map((o) => o?.email);
    }
    if (purchaseOrderData?.owner?.email) {
      ownerCollaboratorEmails.push(purchaseOrderData.owner.email);
    }
    let toEmails = [];
    if (purchaseOrderData?.supplier?.email) {
      toEmails.push(purchaseOrderData.supplier.email);
    }
    setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
  };

  let attachments = [];
  if (pdfFileBase64) {
    attachments.push({
      base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(',') + 1)),
      contentType: pdfFileBase64.split(';')[0].split(':')[1],
      name: `Purchase Order-${purchaseOrderData.purchaseOrderNumber}`
    });
  }

  const fetchEmailAttachment = () => {
    axiosInstance()
      .get(`${purchaseOrder.api}/${purchaseOrderData._id}/pdf?type=ordered`)
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

  const handleViewPdf = (download, pdfType: string = 'ordered') => {
    if (download) {
      setLoading('download');
    } else {
      setLoading('view');
    }
    axiosInstance()
      .get(`${purchaseOrder.api}/${purchaseOrderData?._id}/pdf?type=${pdfType}`)
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
              link.setAttribute('download', `Purchase Order - ${purchaseOrderData.purchaseOrderNumber}.pdf`);
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
      name: 'Purchase Order',
      fileUrl: '',
      relatedTo: [
        {
          type: purchaseOrder.resource,
          referenceId: purchaseOrderData?._id,
          access: true
        },
        {
          type: purchaseOrderData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
          referenceId: purchaseOrderData?.customerAccountName
            ? purchaseOrderData?.customerAccountName?.optionValue
            : purchaseOrderData?.supplierAccountName?.optionValue,
          access: false
        }
      ]
    };
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box display="flex" flexWrap={'wrap'} gridGap={'8px'}>
            {!isMobile && (
              <Button
                variant="outlined"
                color="primary"
                type="button"
                size="small"
                startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
                disabled={loading === 'view'}
                onClick={(e) => {
                  setDownlodingFile(false);
                  handleClick(e);
                }}
              >
                {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : loading === 'view' ? 'Please wait...' : 'Preview'}
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
              disabled={loading === 'download'}
              onClick={(e) => {
                setDownlodingFile(true);
                handleClick(e);
              }}
            >
              {isMobile && !isTablet ? <IoMdDownload size={20} /> : loading === 'download' ? 'Please wait...' : 'Download'}
            </Button>
            <Menu
              id="simple-menu"
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
                onClick={() => {
                  setAnchorEl(null);
                  handleViewPdf(downlodingFile, 'ordered');
                }}
              >
                Ordered
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  handleViewPdf(downlodingFile, 'received');
                }}
              >
                Received
              </MenuItem>
            </Menu>
            {permissions?.purchaseOrder?.isUpdate && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={loading === 'email'}
                startIcon={isMobile ? '' : <MdEmail />}
                onClick={() => {
                  setLoading('email');
                  fetchEmailAttachment();
                }}
              >
                {isMobile && !isTablet ? <MdEmail size={20} /> : loading === 'email' ? 'Please wait...' : `Send Email`}
              </Button>
            )}
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
            id={purchaseOrderData._id}
            isQuoteBuilder={true}
            options={userEmails?.to}
            cc={userEmails?.cc ?? []}
            emailId={null}
            qouteBuilderAttachments={attachments}
            subject={`${user?.user?.brandName ?? 'Brand'} Offer - ${purchaseOrderData?.purchaseOrderId ?? ''}`}
            fromQuote={true}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            referenceType="purchaseOrder"
          />
        </Dialog>
      )}
    </>
  );
};

export default SendEmail;
