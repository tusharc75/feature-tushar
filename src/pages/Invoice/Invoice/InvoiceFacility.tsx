import Box from '@material-ui/core/Box/Box';
import { useState, useContext } from 'react';
import { Button, Dialog, Menu, MenuItem } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, RESOURCE_LABEL, invoice } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/all';
import { IoMdDownload } from 'react-icons/io';
import PreviewDownload from 'src/components/PreviewDownload';

const InvoiceFacility = ({ invoiceData, columns }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [generatingPdfFile, setGeneratingFile] = useState(false);

  const [downlodingFile, setDownlodingFile] = useState(null);
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePDF = (type, PDFType) => {
    setDownlodingFile(type);
    setGeneratingFile(true);
    axiosInstance()
      .get(PDFType === 'Detail' ? `${invoice.api}/${invoiceData._id}/pdf/detail` : `${invoice.api}/${invoiceData._id}/pdf`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            if (type === 'Download') {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Invoice-${invoiceData.invoiceNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
              setDownlodingFile(null);
              setGeneratingFile(false);
            } else if (type === 'Preview') {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              setDownlodingFile(null);
              setGeneratingFile(false);
            } else {
              const file = new Blob([data], { type: 'application/pdf' });
              generateBase64forFile(file, 'pdf');
              setGeneratingFile(false);
            }
          })
          .catch((err) => {
            if (type === 'Email') {
              setSendEmail(true);
            }
            toastConfig.setToastConfig(err);
            setDownlodingFile(null);
            setGeneratingFile(false);
          });
      })
      .catch((err) => {
        if (type === 'Email') {
          setSendEmail(true);
        }
        toastConfig.setToastConfig(err);
        setDownlodingFile(null);
        setGeneratingFile(false);
      });
  };

  const generateBase64forFile = (blobData, type) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      if (type === 'pdf') {
        const attachments = [
          {
            base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
            contentType: base64data.split(';')[0].split(':')[1],
            name: `Invoice-${invoiceData.invoiceNumber}`
          }
        ];
        setEmailAttachments(attachments);
        setSendEmail(true);
      }
    };
  };

  const fetchEmailsData = () => {
    let ownerCollaboratorEmails = [];
    if (invoiceData?.collaborator && invoiceData.collaborator.length) {
      ownerCollaboratorEmails = invoiceData.collaborator.filter((o) => o?.email).map((o) => o?.email);
    }
    if (invoiceData?.owner?.email) {
      ownerCollaboratorEmails.push(invoiceData.owner.email);
    }
    let toEmails = [];
    if (invoiceData?.customerAccount?.email) {
      toEmails.push(invoiceData.customerAccount.email);
    }
    setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center" flexWrap={'wrap'} gridGap={8}>
          {permissions?.invoice?.isRead && (
            <PreviewDownload resource={RESOURCE_LABEL.invoice} referenceId={invoiceData?._id} columns={columns} />
            // <Button
            //   variant="outlined"
            //   color="primary"
            //   type="button"
            //   size="small"
            //   disabled={downlodingFile === 'Preview' ? true : false}
            //   startIcon={isMobile ? '' : <AiFillFilePdf />}
            //   onClick={(e) => {
            //     setDownlodingFile('Preview');
            //     handleClick(e);
            //   }}
            // >
            //   {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile === 'Preview' ? 'Please wait...' : 'Preview'}
            // </Button>
          )}
          {/* {permissions?.invoice?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              disabled={downlodingFile === 'Download' ? true : false}
              startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
              onClick={(e) => {
                setDownlodingFile('Download');
                handleClick(e);
              }}
            >
              {isMobile && !isTablet ? <IoMdDownload size={22} /> : downlodingFile === 'Download' ? 'Please wait...' : 'Download'}
            </Button>
          )} */}
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
                handlePDF(downlodingFile, 'Regular');
              }}
            >
              Regular
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                handlePDF(downlodingFile, 'Detail');
              }}
            >
              Detail
            </MenuItem>
          </Menu>
          {permissions?.invoice?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={downlodingFile === 'Email' ? true : false}
              startIcon={isMobile ? '' : <MdEmail />}
              onClick={() => {
                fetchEmailsData();
                handlePDF('Email', 'Detail');
                handlePDF('Email', 'Regular');
              }}
            >
              {isMobile ? <MdEmail size={22} /> : downlodingFile === 'Email' ? 'Please wait...' : `Send Email`}
            </Button>
          )}
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
            setDownlodingFile(null);
            setFullScreen(false);
          }}
          fullWidth
        >
          <CreateEmail
            generatingFile={generatingPdfFile}
            handleClose={() => {
              setSendEmail(false);
              setDownlodingFile(null);
              setFullScreen(false);
            }}
            fetchData={() => {
              setSendEmail(false);
              setDownlodingFile(null);
              setFullScreen(false);
            }}
            id={invoiceData._id}
            showESign={true}
            isQuoteBuilder={true}
            options={userEmails?.to}
            cc={userEmails?.cc ?? []}
            emailId={null}
            qouteBuilderAttachments={emailAttachments}
            subject={`${user?.user?.brandName ?? 'Brand'} Invoice - ${invoiceData?.invoiceNumber ?? ''}`}
            fromQuote={true}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            referenceType="invoice"
          />
        </Dialog>
      )}
    </>
  );
};

export default InvoiceFacility;
