import { useContext, useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog, IconButton } from '@mui/material';
import {
  CustomDialogTransition,
  IMPORT_EXPORT_STATUS,
  IMPORT_EXPORT_TYPE,
  displayDateTime,
  gridLoadingTimeout,
  prepareDataForGrid
} from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { AiOutlineExport, AiOutlineImport } from 'react-icons/ai';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { GetApp } from '@mui/icons-material';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import NoDataCell from '../Helpers/NoDataCell';
import routes from '../Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const renderedFrom = 'import-export';

const ImportExportDialog = ({ handleClose, type, resource, subResource, referenceId, handleExport, api, additionalParams, refresh }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [downloading, setDownloading] = useState({ loading: false, type: null });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly, pageSizes } = state;

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [refresh, pageSizes, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    let api = `/import-export/logs?resource=${resource}&type=${type}`;
    if (referenceId) {
      api = `${api}&referenceId=${referenceId}`;
    }
    if (subResource) {
      api = `${api}&subResource=${subResource}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject,
            user: u?.user
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchGridColumns = () => {
    let columns = [
      {
        disableFilters: true,
        disableSortBy: true,
        accessor: 'date',
        Header: 'Date & Time',
        Cell: ({ row }) => {
          return row.original?.date ? <p className="text-truncate">{displayDateTime(row?.original?.date)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'user',
        Header: 'User',
        Cell: ({ row }) => {
          return row.original?.user ? (
            <div>
              <a className="link text-truncate" href={`${routes.userDetail.path}/${row.original?.user?._id}`} target="_blank">
                {row.original?.user?.concatedName}
              </a>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row }) => {
          return row.original?.status ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => (
          <>
            {row?.original?.status === IMPORT_EXPORT_STATUS.inProgress && <CircularProgress size={20} aria-disabled />}
            {row?.original?.fileName &&
              ((type === IMPORT_EXPORT_TYPE.export &&
                [IMPORT_EXPORT_STATUS.completed, IMPORT_EXPORT_STATUS.partialComplete]?.includes(row?.original?.status)) ||
                (type === IMPORT_EXPORT_TYPE.import && row?.original?.status === IMPORT_EXPORT_STATUS.error)) && (
                <HtmlTooltip title={'Download'}>
                  <IconButton
                    size="small"
                    aria-label="Delete"
                    onClick={() => {
                      handleDownloadFile(row?.original?._id);
                    }}
                  >
                    <GetApp color={'primary'} fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              )}
          </>
        )
      }
    ];
    setColumns(columns);
  };

  const handleDownloadFile = (fileId) => {
    setDownloading({ loading: true, type: 'file' });
    axiosInstance()
      .get(`/import-export/download-file/${fileId}`, { responseType: 'arraybuffer' })
      .then((data) => {
        setDownloading({ loading: false, type: null });
        let fileText = data.data;
        const fileName = data.headers['content-disposition'].split('filename=')[1];
        fileText && download(fileName, fileText);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'File downloaded successfully'
        });
      })
      .catch((error) => {
        console.error(error, 'error');
        toastConfig.setToastConfig(error);
        setDownloading({ loading: false, type: null });
      });
  };

  function download(fileName, arrayBuffer) {
    const blob = new Blob([arrayBuffer as any]);
    //Check the Browser type and download the File.
    const isIE = false || !!document['documentMode'];
    if (isIE) {
      //@ts-ignore
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      var url = window.URL || window.webkitURL;
      let link = url.createObjectURL(blob);
      var a = document.createElement('a');
      a.setAttribute('download', fileName);
      a.setAttribute('href', link);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  const uploadData = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Uploading, Please wait...`
      });
      const file = event.target.files[0];
      let formData = new FormData();
      formData.append('file', file);

      let importApi = `${api}/import`;

      if (additionalParams) {
        importApi = `${importApi}?${additionalParams}`;
      }
      axiosInstance()
        .post(importApi, formData, { responseType: 'blob', headers: { 'Content-Type': 'multipart/form-data' } })
        .then(() => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Import from excel added in queue successfully.'
          });
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const ImportInput = (
    <input
      onClick={(e: any) => (e.target.value = null)}
      id="importFromExcelMenu"
      name="importFromExcelMenu"
      onChange={uploadData}
      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      style={{
        opacity: '0',
        position: 'absolute',
        zIndex: -1
      }}
      type="file"
    />
  );

  return (
    <Dialog
      open={true}
      aria-labelledby="customized-dialog-title"
      maxWidth="md"
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
        title={type}
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
        <Box pt={1} />
        {type === 'Import' ? (
          <label htmlFor="importFromExcelMenu" style={{ cursor: 'pointer' }}>
            <ThemeButton buttonType="transparent" startIcon={<AiOutlineImport />}>
              {ImportInput}
              Import from Excel
            </ThemeButton>
          </label>
        ) : (
          <ThemeButton onClick={handleExport} startIcon={<AiOutlineExport />}>
            Export to Excel
          </ThemeButton>
        )}
        {columns ? (
          <CustomReactTable
            height={fullScreen ? 'calc(100vh - 285px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            hideSelection={true}
            showFilters={false}
            showArrangeView={false}
          />
        ) : (
          <Box p={2} height={300}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          buttonType="transparent"
          onClick={(e) => {
            handleClose();
          }}
        >
          Close
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ImportExportDialog;
