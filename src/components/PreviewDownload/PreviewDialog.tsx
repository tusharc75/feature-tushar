import { useContext, useEffect, useState } from 'react';
import { Box, Dialog, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ViewDialog } from './ViewDialog';
import { PreviewFields } from './PreviewFields';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import DownloadIcon from '@material-ui/icons/GetApp';
import { Accordion, AccordionDetails, AccordionSummary } from '../CustomAccordion';
import { capitalize, set } from 'lodash';
import NoDataCell from '../Helpers/NoDataCell';


export const PreviewDialog = ({
  type,
  handleClose,
  handleView,
  loadingType,
  loading,
  hideDetailButton,
  allColumn,
  resource,
  referenceId,
  defaultColumns,
  columns,
  button1Title,
  button2Title,
  operation,
  isExcelDownload,
  isAsyncDownload
}) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [views, setViews] = useState([]);
  const [showSaveViewDialog, setShowSaveViewDialog] = useState({ open: false, data: null });


  const [selectedPdfView, setSelectedPdfView] = useState(null);
  const [visibleColumnsPdf, setVisibleColumnsPdf] = useState([]);

  const [selectedExcelView, setSelectedExcelView] = useState(null);
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState([]);

  const [myRequestsShow, setMyRequestsShow] = useState(false);
  const [myRequests, setMyRequests] = useState(null);
  const [downloadingRequest, setDownloadingRequest] = useState({ loading: false, id: null })

  useEffect(() => {
    setDefaultColumns()
  }, [columns]);

  useEffect(() => {
    fetchUserViews();
    if (isAsyncDownload && type === 'PDF') {
      fetchUserRequests();
    }
  }, []);

  const setDefaultColumns = () => {
    const temp = defaultColumns?.length > 0 ? allColumn?.filter((e: any) => defaultColumns?.includes(e?.fieldName)) : allColumn;
    setVisibleColumnsPdf([...temp]);
    setVisibleColumnsExcel([...temp]);
  }

  const fetchUserViews = () => {
    axiosInstance()
      .get(`/pdf/view?resource=${resource}`)
      .then(({ data: { data } }) => {
        setViews(data);
        if (!selectedPdfView && data?.length === 1) {
          handleSelectView(data[0])
        }
        if (selectedPdfView && data?.length && data?.find((e) => e._id === selectedPdfView?._id)) {
          handleSelectView(data?.find((e) => e._id === selectedPdfView?._id))
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSelectView = (data) => {
    setSelectedPdfView(data);
    if (data && data.columns) {
      const columnsArray = data?.columns?.split(',')?.map((item) => item?.trim());
      setVisibleColumnsPdf(columnsArray?.map(e => { return allColumn.find(col => col.fieldName === e) }).filter(col => col !== undefined));
      setVisibleColumnsExcel(columnsArray?.map(e => { return allColumn.find(col => col.fieldName === e) }).filter(col => col !== undefined));
    }
  };

  const fetchUserRequests = () => {
    axiosInstance()
      .get(`/pdf/async-download/${referenceId}/my-requests?resource=${resource}`)
      .then(({ data: { data } }) => {
        setMyRequests(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const downloadFile = (data) => {
    setDownloadingRequest({ loading: true, id: data._id });
    axiosInstance()
      .get(`user/download?fileName=${data?.file}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);

          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Downloaded Successfully',
              open: true,
              type: 'success'
            });
            setTimeout(() => {
              setDownloadingRequest({ loading: false, id: null });
            }, 2000);
          }
        }
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
        toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
        setDownloadingRequest({ loading: false, id: null });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setDownloadingRequest({ loading: false, id: null });
      });
  }

  return (
    <>
      <Dialog
        open={true}
        aria-labelledby="customized-dialog-title"
        maxWidth="sm"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CustomDialogHeader
          title={`Visible Columns in ${type}`}
          onClose={() => {
            handleClose();
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
              {type?.includes('PDF') &&
                <PreviewFields
                  views={views}
                  selectedView={selectedPdfView}
                  setSelectedView={setSelectedPdfView}
                  visibleColumns={visibleColumnsPdf}
                  setVisibleColumns={setVisibleColumnsPdf}
                  fetchUserViews={fetchUserViews}
                  allColumn={allColumn}
                  resource={resource}
                  type={"PDF"}
                />}
              {type?.includes('Excel') &&
                <Box mt={3}>
                  <PreviewFields
                    views={views}
                    selectedView={selectedExcelView}
                    setSelectedView={setSelectedExcelView}
                    visibleColumns={visibleColumnsExcel}
                    setVisibleColumns={setVisibleColumnsExcel}
                    fetchUserViews={fetchUserViews}
                    allColumn={allColumn}
                    resource={resource}
                    type={"Excel"}
                  />
                </Box>
              }
            </Grid>
            {isAsyncDownload && type === 'PDF' && <Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
              <Box
                sx={{
                  // border: "1px solid gray",
                  // borderRadius: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Accordion expanded={myRequestsShow} onChange={() => setMyRequestsShow(!myRequestsShow)}>
                  <AccordionSummary>
                    <Typography variant="inherit" >Your Requests {myRequests?.length ? `(${myRequests?.length})` : ""}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Pdf Name</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {myRequests && myRequests?.length > 0 ?
                              myRequests?.map((row) => (
                                <TableRow key={row._id}>
                                  <TableCell>{row?.file ?? <NoDataCell />}</TableCell>
                                  <TableCell>
                                    <Typography variant="inherit" >{capitalize(row?.status)}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      color="primary"
                                      size="small"
                                      disabled={row?.status !== 'processed'}
                                      onClick={(e) => {
                                        downloadFile(row);
                                      }}
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              )) : "No Requests Found"}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Grid>}
          </Grid>
        </CustomDialogContent>
        <CustomDialogFooter>
          {operation !== 'Send Email' &&
            <CustomButton
              onClick={() => {
                setShowSaveViewDialog({ open: true, data: type === 'Excel' ? selectedExcelView : selectedPdfView });
              }}
              disabled={visibleColumnsPdf?.length == 0}
              size="small"
              className="yellow-button"
            >
              {type === 'Excel' ? selectedExcelView ? 'Update View' : 'Save View' : selectedPdfView ? 'Update View' : 'Save View'}
            </CustomButton>
          }
          {operation === 'Send Email' ?
            <CustomButton
              variant="contained"
              className="no-shadow"
              color="primary"
              size="small"
              loading={loadingType === 'Regular' || loading}
              disabled={loadingType || visibleColumnsPdf?.length === 0}
              onClick={(e) => {
                handleView('Regular', visibleColumnsPdf, visibleColumnsExcel);
              }}
            >
              {operation}
            </CustomButton> :
            <>
              <CustomButton
                variant="contained"
                className="no-shadow"
                color="primary"
                size="small"
                loading={loadingType === 'Regular' || loading}
                disabled={loadingType || visibleColumnsPdf?.length === 0}
                onClick={(e) => {
                  handleView('Regular', visibleColumnsPdf, visibleColumnsExcel);
                }}
              >
                {type === 'Excel' ? 'Export' : hideDetailButton ? `${operation}` : `${button1Title} ${operation}`}
              </CustomButton>
              {hideDetailButton || type === 'Excel' ? null : (
                <CustomButton
                  variant="contained"
                  color="primary"
                  className="no-shadow"
                  size="small"
                  loading={loadingType === 'Detail' || loading}
                  disabled={loadingType || visibleColumnsPdf?.length === 0}
                  onClick={(e) => {
                    handleView('Detail', visibleColumnsPdf, visibleColumnsExcel);
                  }}
                >
                  {`${button2Title} ${operation}`}
                </CustomButton>
              )}</>
          }
        </CustomDialogFooter>
      </Dialog>
      {showSaveViewDialog.open && (
        <ViewDialog
          columns={type === 'Excel' ? visibleColumnsExcel?.map((e) => e?.fieldName) : visibleColumnsPdf?.map((e) => e?.fieldName)}
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
    </>
  );
};
