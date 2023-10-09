import { useContext, useEffect, useState } from 'react';
import { Box, Dialog, Grid } from '@material-ui/core';
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


export const PreviewDialog = ({
  type,
  handleClose,
  handleView,
  loadingType,
  loading,
  hideDetailButton,
  allColumn,
  resource,
  defaultColumns,
  columns,
  button1Title,
  button2Title,
  operation,
  isExcelDownload
}) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [views, setViews] = useState([]);
  const [showSaveViewDialog, setShowSaveViewDialog] = useState({ open: false, data: null });


  const [selectedPdfView, setSelectedPdfView] = useState(null);
  const [visibleColumnsPdf, setVisibleColumnsPdf] = useState([]);

  const [selectedExcelView, setSelectedExcelView] = useState(null);
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState([]);

  useEffect(() => {
    const temp = defaultColumns?.length > 0 ? allColumn?.filter((e: any) => defaultColumns?.includes(e?.fieldName)) : allColumn;
    setVisibleColumnsPdf([...temp]);
    setVisibleColumnsExcel([...temp]);
  }, [columns]);

  useEffect(() => {
    fetchUserViews();
  }, []);

  const fetchUserViews = () => {
    axiosInstance()
      .get(`/pdf/view?resource=${resource}`)
      .then(({ data: { data } }) => {
        setViews(data);
        if (data?.length && selectedPdfView && data?.find((e) => e._id === selectedPdfView?._id)) {
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
    }
  };

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
          </Grid>
        </CustomDialogContent>
        <CustomDialogFooter>
          {operation !== 'Send Email' &&
            <CustomButton
              onClick={() => {
                setShowSaveViewDialog({ open: true, data: selectedPdfView });
              }}
              disabled={visibleColumnsPdf?.length == 0}
              size="small"
              className="yellow-button"
            >
              {selectedPdfView ? 'Update View' : 'Save View'}
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
                {hideDetailButton ? `${operation}` : `${button1Title} ${operation}`}
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
          columns={visibleColumnsPdf?.map((e) => e?.fieldName)}
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
