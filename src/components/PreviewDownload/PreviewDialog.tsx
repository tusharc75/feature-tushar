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
import DownloadHistory from './DownloadHistory';
import { useData } from '../../StateProvider/Provider';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cloneDeep } from 'lodash';

export const PreviewDialog = ({
  type,
  handleClose,
  handleView,
  loadingType,
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

  const [sortBy, setSortBy] = useState(null);
  const [orderBy, setOrderBy] = useState(null);

  const { state: { user: { user } } } = useData();

  useEffect(() => {
    setDefaultColumns();
  }, [columns]);

  useEffect(() => {
    fetchUserViews();
  }, []);

  const setDefaultColumns = () => {
    const temp = defaultColumns?.length > 0 ? allColumn?.filter((e: any) => defaultColumns?.includes(e?.fieldName)) : allColumn;
    setVisibleColumnsPdf([...temp]);
    setVisibleColumnsExcel([...temp]);
  };

  const fetchUserViews = () => {
    axiosInstance()
      .get(`/pdf/view?resource=${resource}`)
      .then(({ data: { data } }) => {
        setViews(data);
        if (!selectedPdfView && data?.length === 1) {
          handleSelectView(data[0]);
        }
        if (selectedPdfView && data?.length && data?.find((e) => e._id === selectedPdfView?._id)) {
          handleSelectView(data?.find((e) => e._id === selectedPdfView?._id));
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSelectView = (data) => {
    setSelectedPdfView(data);
    if (data?.columns?.length) {
      setVisibleColumnsPdf(
        data.columns
          ?.map((e) => {
            const col = allColumn.find((col) => col.fieldName === e.name);
            if (col) return { ...col, ...(e?.width ? { width: e.width } : {}), ...(e?.customLabel ? { customLabel: e.customLabel } : {}) };
          })
          .filter((col) => col !== undefined)
      );
      setVisibleColumnsExcel(
        data.columns
          ?.map((e) => {
            const col = allColumn.find((col) => col.fieldName === e.name);
            if (col) return { ...col, ...(e?.width ? { width: e.width } : {}), ...(e?.customLabel ? { customLabel: e.customLabel } : {}) };
          })
          .filter((col) => col !== undefined)
      );
      if (data?.sortBy) {
        setSortBy(allColumn.find(col => col.fieldName === data?.sortBy));
      }
      if (data?.orderBy) {
        setOrderBy(data?.orderBy);
      }
    }
  };

  const checkVisibleColumnsSame = (visibleColumns, selectedView): Boolean => {
    if (!visibleColumns?.length) return true;
    if (visibleColumns?.length !== selectedView?.columns?.length || sortBy?.fieldName != selectedView?.sortBy || orderBy != selectedView?.orderBy) {
      return false;
    }
    for (const col of visibleColumns) {
      const column = selectedView?.columns?.find((e) => e?.name === col?.fieldName);
      if (!column || ((column?.customLabel || null) !== (col?.customLabel || null)) || ((column?.width || null) !== (col?.width || null))) {
        return false;
      }
    }
    return true;
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
              {type?.includes('PDF') && (
                <PreviewFields
                  views={views}
                  selectedView={selectedPdfView}
                  setSelectedView={setSelectedPdfView}
                  visibleColumns={visibleColumnsPdf}
                  setVisibleColumns={setVisibleColumnsPdf}
                  fetchUserViews={fetchUserViews}
                  allColumn={allColumn}
                  resource={resource}
                  type={'PDF'}
                  defaultColumns={defaultColumns}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  orderBy={orderBy}
                  setOrderBy={setOrderBy}
                />
              )}
              {type?.includes('Excel') && (
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
                    type={'Excel'}
                    defaultColumns={defaultColumns}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    orderBy={orderBy}
                    setOrderBy={setOrderBy}
                  />
                </Box>
              )}
            </Grid>
            {isAsyncDownload && <DownloadHistory referenceId={referenceId} resource={resource} loadingType={loadingType} />}
          </Grid>
        </CustomDialogContent>
        <CustomDialogFooter>
          {(type?.includes('Excel') || type?.includes('PDF')) && (selectedExcelView || selectedPdfView) && !checkVisibleColumnsSame(type?.includes('Excel') ? visibleColumnsExcel : visibleColumnsPdf, type?.includes('Excel') ? selectedExcelView : selectedPdfView) && (
            <>
              <CustomButton
                id={'show-column-dialog-save-update-button'}
                onClick={() => {
                  const selectedView = type === 'Excel' ? cloneDeep(selectedExcelView) : cloneDeep(selectedPdfView);
                  delete selectedView._id;
                  setShowSaveViewDialog({ open: true, data: selectedView });
                }}
                disabled={sortBy && !orderBy}
                size="small"
                className="yellow-button"
              >
                Save as New View
              </CustomButton>
            </>
          )}
          {type?.includes('Excel') && type?.includes('PDF') ? null : (
            <HtmlTooltip title={selectedPdfView?.user && user?._id !== selectedPdfView?.user ? 'View owner can only update' : ''}>
              <>
                <CustomButton
                  id={'show-column-dialog-save-update-button'}
                  onClick={() => {
                    setShowSaveViewDialog({ open: true, data: type === 'Excel' ? selectedExcelView : selectedPdfView });
                  }}
                  disabled={visibleColumnsPdf?.length == 0 || (sortBy && !orderBy) || (selectedPdfView?.user && user?._id !== selectedPdfView?.user)}
                  size="small"
                  className="yellow-button"
                >
                  {type === 'Excel' ? (selectedExcelView ? 'Update View' : 'Save View') : selectedPdfView ? 'Update View' : 'Save View'}
                </CustomButton>
              </>
            </HtmlTooltip>
          )}
          {operation === 'Send Email' ? (
            <CustomButton
              variant="contained"
              className="no-shadow"
              color="primary"
              size="small"
              loading={loadingType === 'Regular'}
              disabled={loadingType || visibleColumnsPdf?.length === 0}
              onClick={(e) => {
                handleView('Regular', visibleColumnsPdf, visibleColumnsExcel, sortBy?.fieldName, orderBy);
              }}
              id={'show-column-dialog-send-email-button'}
            >
              {operation}
            </CustomButton>
          ) : (
            <>
              <CustomButton
                variant="contained"
                className="no-shadow"
                color="primary"
                id={'show-column-dialog-export-button'}
                size="small"
                loading={loadingType === 'Regular'}
                disabled={loadingType || visibleColumnsPdf?.length === 0 || (sortBy && !orderBy)}
                onClick={(e) => {
                  handleView('Regular', visibleColumnsPdf, visibleColumnsExcel, sortBy?.fieldName, orderBy);
                }}
              >
                {type === 'Excel' ? 'Export' : hideDetailButton ? `${operation}` : `${button1Title} ${operation}`}
              </CustomButton>
              {hideDetailButton || type === 'Excel' ? null : (
                <CustomButton
                  variant="contained"
                  color="primary"
                  className="no-shadow"
                  id={'show-column-dialog-operation-2-button'}
                  size="small"
                  loading={loadingType === 'Detail'}
                  disabled={loadingType || visibleColumnsPdf?.length === 0 || (sortBy && !orderBy)}
                  onClick={(e) => {
                    handleView('Detail', visibleColumnsPdf, visibleColumnsExcel, sortBy?.fieldName, orderBy);
                  }}
                >
                  {`${button2Title} ${operation}`}
                </CustomButton>
              )}
            </>
          )}
        </CustomDialogFooter>
      </Dialog>
      {showSaveViewDialog.open && (
        <ViewDialog
          columns={type === 'Excel' ? visibleColumnsExcel : visibleColumnsPdf}
          resource={resource}
          handleSucess={() => {
            setShowSaveViewDialog({ open: false, data: null });
            fetchUserViews();
          }}
          handleClose={() => {
            setShowSaveViewDialog({ open: false, data: null });
          }}
          viewData={showSaveViewDialog.data}
          sortBy={sortBy}
          orderBy={orderBy}
        />
      )}
    </>
  );
};
