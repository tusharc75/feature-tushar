import { Box, Button, Checkbox, Dialog, FormControl, Grid, IconButton, TextField } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillEdit, AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomButton from '../Helpers/CustomButton';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { MdEmail } from 'react-icons/md';
import { CreateEmail } from '../Activity/Email/CreateEmail';
import { ViewDialog } from './ViewDialog';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ConfirmationDialog from '../Helpers/ConfirmationDialog';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

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

  const [visibleColumnsPdf, setVisibleColumnsPdf] = useState([]);
  const [showColumnsDialog, setShowColumnsDialog] = useState({ open: false, type: '' });
  const [loadingType, setLoadingType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [emailAttachments, setEmailAttachments] = useState([]);
  const [views, setViews] = useState([]);

  const [showSaveViewDialog, setShowSaveViewDialog] = useState({ open: false, data: null });
  const [selectedView, setSelectedView] = useState(null);

  const [isViewDeleteConfirm, setIsViewDeleteConfirm] = useState({ open: false, id: null });

  const fetchUserViews = () => {
    axiosInstance()
      .get(`/pdf/view?resource=${resource}`)
      .then(({ data }) => {
        setViews(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  useEffect(() => {
    fetchUserViews();
  }, []);

  useEffect(() => {
    const temp =
      defaultColumns?.length > 0
        ? allColumn?.filter((e: any) => defaultColumns?.includes(e?.fieldName))?.map((e) => e.fieldLabel)
        : allColumn?.map((e) => e.fieldLabel);
    setVisibleColumnsPdf([...temp]);
  }, [columns]);

  const handleDeleteView = () => {
    axiosInstance()
      .post(`/pdf/view/remove`, { _id: isViewDeleteConfirm.id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchUserViews();
        setIsViewDeleteConfirm({ open: false, id: null });
        setSelectedView(null);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

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
        <Dialog
          open={showColumnsDialog.open}
          aria-labelledby="customized-dialog-title"
          maxWidth="sm"
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setShowColumnsDialog({ open: false, type: '' });
            }
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title={`Visible Columns in ${showColumnsDialog.type}`}
            onClose={() => {
              setShowColumnsDialog({ open: false, type: '' });
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
          />
          <CustomDialogContent>
            <Grid container justify="space-between" alignItems="center">
              <Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
                <FormControl fullWidth>
                  <Box pb={5}>
                    <Autocomplete
                      fullWidth
                      size="small"
                      value={selectedView}
                      onChange={(e, selectedOption) => {
                        setSelectedView(selectedOption);
                        if (selectedOption && selectedOption.columns) {
                          const columnsArray = selectedOption.columns.split(',').map((item) => item.trim());
                          setVisibleColumnsPdf(columnsArray);
                        }
                      }}
                      getOptionLabel={(option) => option.name}
                      renderOption={(option) => (
                        <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} width={'100%'}>
                          <span style={{ width: 'calc(100% - 71px)' }}>{option?.name}</span>
                          <Box>
                            <IconButton size="small" style={{ marginRight: '20px' }}>
                              <AiFillEdit />
                            </IconButton>
                            <IconButton size="small" onClick={() => setIsViewDeleteConfirm({ open: true, id: option._id })}>
                              <RiDeleteBin6Fill />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                      id="controllable-states-demo"
                      options={views}
                      renderInput={(params) => <TextField {...params} fullWidth label="Select View" variant="outlined" />}
                    />
                  </Box>
                  <Autocomplete
                    id="demo-mutiple-chip"
                    fullWidth
                    size="small"
                    multiple
                    value={visibleColumnsPdf}
                    onChange={(e, val) => {
                      if (
                        val.includes('Select All') &&
                        ['Select All', ...allColumn?.map((e) => e?.fieldLabel)].sort().toString() !== val.sort().toString()
                      ) {
                        setVisibleColumnsPdf(allColumn?.map((e) => e?.fieldLabel));
                      } else if (['Select All', ...allColumn?.map((e) => e?.fieldLabel)].sort().toString() === val.sort().toString()) {
                        setVisibleColumnsPdf([]);
                      } else {
                        setVisibleColumnsPdf(allColumn?.map((e) => e?.fieldLabel)?.filter((d) => val.includes(d)));
                      }
                    }}
                    options={['Select All', ...allColumn?.map((e) => e?.fieldLabel)]}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(option, { selected }) => (
                      <React.Fragment>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={
                            showColumnsDialog &&
                            ['Select All', ...allColumn?.map((e) => e?.fieldLabel)].sort().toString() ===
                              ['Select All', ...visibleColumnsPdf].sort().toString()
                              ? true
                              : selected
                          }
                        />
                        {option}
                      </React.Fragment>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" label={`Visible Columns in ${showColumnsDialog.type}`} placeholder="Select" />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <CustomButton
              onClick={() => {
                setShowSaveViewDialog({ open: true, data: selectedView });
              }}
              disabled={visibleColumnsPdf.length == 0}
              size="small"
              className="yellow-button"
            >
              {selectedView ? 'Update View' : 'Save View'}
            </CustomButton>
            <CustomButton
              variant="contained"
              className="no-shadow"
              color="primary"
              size="small"
              loading={loadingType === 'Regular' || loading}
              disabled={loadingType || visibleColumnsPdf?.length === 0}
              onClick={(e) => {
                handleViewPdf(downlodingFile, 'Regular', visibleColumnsPdf);
              }}
            >
              Regular
            </CustomButton>
            {hideDetailButton ? null : (
              <CustomButton
                variant="contained"
                color="primary"
                className="no-shadow"
                size="small"
                loading={loadingType === 'Detail' || loading}
                disabled={loadingType || visibleColumnsPdf?.length === 0}
                onClick={(e) => {
                  handleViewPdf(downlodingFile, 'Detail', visibleColumnsPdf);
                }}
              >
                Detail
              </CustomButton>
            )}
          </CustomDialogFooter>
        </Dialog>
      )}
      {isViewDeleteConfirm.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => setIsViewDeleteConfirm({ open: false, id: null })}
          onOk={handleDeleteView}
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
      {showSaveViewDialog.open && (
        <ViewDialog
          columns={visibleColumnsPdf}
          resource={resource}
          handleSucess={() => {
            setShowSaveViewDialog({ open: false, data: null });
            fetchUserViews();
          }}
          handleClose={() => {
            setShowSaveViewDialog({ open: false, data: null });
          }}
          viewData={showSaveViewDialog.data}
        />
      )}
    </Box>
  );
}

export default PreviewDownload;
