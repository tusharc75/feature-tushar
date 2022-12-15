import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, Chip, Dialog, FormControl, Grid, Menu, MenuItem, TextField } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, purchaseOrder, customerAccount, supplierAccount, quotation } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { IoMdDownload } from 'react-icons/io';
import { AiOutlineFileExcel } from 'react-icons/ai';
import contactClass from '../../../Contact/contact.module.scss';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CustomButton from 'src/components/Helpers/CustomButton';
import { GiReceiveMoney } from 'react-icons/gi';
import { VscVersions } from 'react-icons/vsc';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const SendEmail = ({ quotationData, versionData, isSendEmail = false, previewOnly = false, allowedToEdit, versionId, allColumn, columns,
  setShowAllVersionStatus, setShowQuotationSummaryDialog, currentVersion, hideSummary = false, hideVersions = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [pdfFileBase64, setPdfFileBase64] = useState(null);
  const [loading, setLoading] = useState(null);
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState([]);
  const [showExcelArrangeColumns, setShowExcelArrangeColumns] = useState(false);
  const [excelArrangeColumnLoading, setExcelArrangeColumnLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [downlodingFile, setDownlodingFile] = useState(null);

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
    if (quotationData?.customerContact?.email) {
      toEmails.push(quotationData.customerContact.email);
    }
    setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
  };

  let attachments = [];
  if (pdfFileBase64) {
    attachments.push({
      base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(',') + 1)),
      contentType: pdfFileBase64.split(';')[0].split(':')[1],
      name: `Rental Order-${quotationData.quotationNumber}`
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

  const handleViewPdf = (type, PDFType) => {
    if (type === 'Download') {
      setLoading('download');
    } else {
      setLoading('view');
    }
    axiosInstance()
      .get(PDFType === "Detail" ?
        `${quotation.api}/${quotationData._id}/pdf/${versionData._id}/detail`
        : `${quotation.api}/${quotationData._id}/pdf/${versionData._id}`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            setLoading(null);
            if (type === 'Download') {
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
          <Box display="flex">
            {!hideSummary &&
              <Button
                onClick={() => {
                  setShowQuotationSummaryDialog(true);
                }}
                variant="outlined"
                size="small"
                className="mx-1"
                startIcon={<GiReceiveMoney />}
                color="primary"
              >
                Summary
              </Button>}
            {!hideVersions &&
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="primary"
                size="small"
                className={isMobile && !isTablet ? contactClass.mobile_button_layout : 'mx-1'}
                onClick={() => {
                  setShowAllVersionStatus(true);
                }}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                startIcon={isMobile && !isTablet ? null : <VscVersions />}
              >
                {isMobile && !isTablet ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
              </Button>}
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              size="small"
              className={isMobile && !isTablet ? contactClass.mobile_button_layout : 'mx-1'}
              onClick={() => {
                setShowExcelArrangeColumns(true);
              }}
              style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
              startIcon={isMobile && !isTablet ? null : <AiOutlineFileExcel />}
            >
              {isMobile && !isTablet ? <AiOutlineFileExcel size={20} /> : `Excel Download`}
            </Button>
            <Box mx={0.5} />
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
              disabled={loading === 'view'}
              onClick={(e) => {
                setDownlodingFile("Preview");
                handleClick(e);
              }}
            >
              {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : loading === 'view' ? 'Please wait...' : 'Preview'}
            </Button>
            {!previewOnly &&
              <>
                <Box mx={0.5} />
                <Button
                  variant="outlined"
                  color="primary"
                  type="button"
                  size="small"
                  startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
                  disabled={loading === 'download'}
                  onClick={(e) => {
                    setDownlodingFile("Download");
                    handleClick(e)
                  }}
                >
                  {isMobile && !isTablet ? <IoMdDownload size={20} /> : loading === 'download' ? 'Please wait...' : 'Download'}
                </Button>
              </>
            }
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => {
                setAnchorEl(null)
                handleViewPdf(downlodingFile, "Regular")
              }}>Regular</MenuItem>
              <MenuItem onClick={() => {
                setAnchorEl(null)
                handleViewPdf(downlodingFile, "Detail")
              }}>Detail</MenuItem>
            </Menu>
            {isSendEmail && <>
              <Box mx={0.5} />
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={loading === "email"}
                startIcon={isMobile ? '' : <MdEmail />}
                onClick={() => {
                  setLoading("email")
                  fetchEmailAttachment()
                }}
              >
                {isMobile && !isTablet ? <MdEmail size={20} /> : loading === "email" ? "Please wait..." : `Send Email`}
              </Button>
            </>}
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
            id={quotationData.rentalManagement}
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
            refrenceType="rentalJob"
          />
        </Dialog>
      )}
      {showExcelArrangeColumns && (
        <Dialog
          open={showExcelArrangeColumns}
          aria-labelledby="customized-dialog-title"
          maxWidth="sm"
          onClose={() => {
            setShowExcelArrangeColumns(false);
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title={`View Columns Excel`}
            onClose={() => {
              setShowExcelArrangeColumns(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <Grid container justify="space-between" alignItems="center">
              <Grid item xs={12} md={12} sm={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    id="demo-mutiple-chip"
                    disabled={!allowedToEdit}
                    fullWidth
                    size="small"
                    multiple
                    value={visibleColumnsExcel}
                    onChange={(e, val) => {
                      if (val.includes('Select All') && ['Select All', ...allColumn].sort().toString() !== val.sort().toString()) {
                        setVisibleColumnsExcel(allColumn);
                      } else if (['Select All', ...allColumn].sort().toString() === val.sort().toString()) {
                        setVisibleColumnsExcel([]);
                      } else {
                        setVisibleColumnsExcel(val);
                      }
                    }}
                    options={['Select All', ...allColumn]}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(option, { selected }) => (
                      <React.Fragment>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={
                            showExcelArrangeColumns &&
                              ['Select All', ...allColumn].sort().toString() === ['Select All', ...visibleColumnsExcel].sort().toString()
                              ? true
                              : selected
                          }
                        />
                        {option}
                      </React.Fragment>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" label={`Visible Columns in Quote Excel`} placeholder="Select " />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <CustomButton
              variant="contained"
              color="primary"
              size="small"
              loading={excelArrangeColumnLoading}
              disabled={visibleColumnsExcel.length === 0}
              onClick={(e) => {
                e.preventDefault();
                setExcelArrangeColumnLoading(true);
                axiosInstance()
                  .post(
                    `${quotation.api}/template`,
                    {
                      id: quotationData._id,
                      versionId: versionId,
                      columns: columns
                        .filter((d) => visibleColumnsExcel?.includes(d?.Header))
                        .map((d) => {
                          if (d?.accessor === 'qtyDisplay') {
                            return 'qty';
                          } else {
                            return d?.accessor.split('_')[0];
                          }
                        })
                    },
                    { responseType: 'blob' }
                  )
                  .then(({ data }) => {
                    setExcelArrangeColumnLoading(false);
                    setShowExcelArrangeColumns(false);
                    const url = window.URL.createObjectURL(new Blob([data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', quotationData.quotationNumber + '.' + 'xlsx');
                    document.body.appendChild(link);
                    link.click();
                  })
                  .catch((err) => {
                    setExcelArrangeColumnLoading(false);
                    toastConfig.setToastConfig(err);
                  });
              }}
            >
              Download
            </CustomButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </>
  );
};

export default SendEmail;
