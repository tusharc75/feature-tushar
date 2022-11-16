import Box from '@material-ui/core/Box/Box';
import React, { useState, useEffect, useReducer, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, Dialog, useMediaQuery } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
  CustomDialogTransition,
  dateFormat,
  formatAmountWithCurrency,
  customerContact,
  gridLoadingTimeout,
  invoice,
  purchaseOrder,
  sidebarResource
} from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillFilePdf } from 'react-icons/ai';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import moment from 'moment';
import { BiPurchaseTagAlt, MdEmail } from 'react-icons/all';
import { CURReplaceByCurrencySingle } from '../../../constants/formulaUtility';
import { getColumnData, getStaticFields, getFrameworkComponents, genrateColoum } from '../../../constants/columns';
import { prepareDataForGrid } from '../../../constants/helpers';
import CustomAgGridEditable from '../../../components/AgGridComponents/CustomAgGridEditable';
import { Link } from 'react-router-dom';
import { startCase } from 'lodash';
import { fetch_invoice_product_fields } from '../../../components/Invoice/helper';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';

const InvoiceFacility = ({ invoiceData }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [generatingPdfFile, setGeneratingFile] = useState(false);

  const [downlodingFile, setDownlodingFile] = useState(null);
  const [emailAttachments, setEmailAttachments] = useState([]);

  const handlePDF = (type) => {
    setDownlodingFile(type);
    setGeneratingFile(true);
    axiosInstance()
      .get(`${invoice.api}/${invoiceData._id}/pdf`)
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

  return (
    <>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          {permissions?.invoice?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              disabled={downlodingFile === 'Preview' ? true : false}
              startIcon={isMobile ? '' : <AiFillFilePdf />}
              onClick={() => handlePDF('Preview')}
            >
              {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile === 'Preview' ? 'Please wait...' : 'Preview'}
            </Button>
          )}
          <Box mx={1} />
          {permissions?.invoice?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              disabled={downlodingFile === 'Download' ? true : false}
              startIcon={isMobile ? '' : <AiFillFilePdf />}
              onClick={() => handlePDF('Download')}
            >
              {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile === 'Download' ? 'Please wait...' : 'Download'}
            </Button>
          )}
          <Box mx={1} />
          {permissions?.invoice?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={downlodingFile === 'Email' ? true : false}
              startIcon={isMobile ? '' : <MdEmail />}
              onClick={() => {
                fetchEmailsData();
                handlePDF('Email');
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
            refrenceType="invoice"
          />
        </Dialog>
      )}
    </>
  );
};

export default InvoiceFacility;
