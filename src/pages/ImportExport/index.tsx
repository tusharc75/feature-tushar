import { useState, useEffect, useContext, Fragment } from 'react';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { Box, Grid, Button, CircularProgress, Typography, IconButton } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { AiOutlineExport, AiOutlineImport } from 'react-icons/ai';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { displayDateTime, downloadExcel, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { GetApp } from '@mui/icons-material';
import { CustomImport } from './customImport';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';

const renderedFrom = 'import-export';

const ImportExport = () => {
  const toastConfig = useContext(CustomToastContext);
  const { setToastConfig } = useContext(CustomToastContext);
  const [excelUploadProgress, setExcelUploadProgress] = useState(0);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [isImgUploading, setImgUploading] = useState(false);
  const [downloading, setDownloading] = useState({ loading: false, type: null });
  const [selectResource, setSelectResource] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [selectCustomHeader, setSelectCustomHeader] = useState(null);
  const [selectTemplateHeader, setSelectTemplateHeader] = useState(null);
  const [customImportDialog, setCustomImportDialog] = useState(false);
  const [columns, setColumns] = useState(null);
  const [file, setFile] = useState({});

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectResource]);

  const fetchLogs = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/import-export/logs${selectResource ? `?resource=${selectResource}` : ''}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: err?.error || 'Something went wrong'
        });
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'type',
        Header: 'Type',
        Cell: ({ row }) => {
          return row.original?.type ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'resource',
        Header: 'Resource',
        Cell: ({ row }) => {
          return row.original?.resource ? <p className="text-truncate">{row.original.resource}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'date',
        Header: 'Date & Time',
        Cell: ({ row }) => {
          return row.original?.date ? <p className="text-truncate">{displayDateTime(row?.original?.date)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row }) => {
          return row.original?.status ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
        }
      },
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const handleImportFile = async (e) => {
    let files = e.target.files[0];
    setExcelUploadProgress(0);
    let formData = new FormData();
    formData.append('file', files);
    let uploadUrl = `/import-export/import${selectResource ? `?resource=${selectResource}` : ''}`;
    setImgUploading(true);
    if (uploadingImageOrFileProgress) {
      setUploadingImageOrFileProgress(1);
    }
    await axiosInstance()
      .post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setExcelUploadProgress(completedPercent);
          if (uploadingImageOrFileProgress) {
            setUploadingImageOrFileProgress(completedPercent);
          }
          if (completedPercent === 100) {
            setTimeout(() => {
              setExcelUploadProgress(0);
              if (uploadingImageOrFileProgress) {
                setUploadingImageOrFileProgress(0);
              }
            }, 4000);
          }
        }
      })
      .then(({ data }) => {
        setImgUploading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'File uploaded successfully'
        });
        fetchLogs();
      })
      .catch((err) => {
        setImgUploading(false);
        setToastConfig(err);
        setExcelUploadProgress(0);
        if (uploadingImageOrFileProgress) {
          setUploadingImageOrFileProgress(0);
        }
      });
  };

  const handleExportExcel = async () => {
    setDownloading({ loading: true, type: 'export' });
    axiosInstance()
      .get(`/import-export/export${selectResource ? `?resource=${selectResource}` : ''}`)
      .then((data) => {
        setDownloading({ loading: false, type: null });
        fetchLogs();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Data Export Initiated'
        });
      })
      .catch((err) => {
        setDownloading({ loading: false, type: null });
        toastConfig.setToastConfig(err);
      });
  };

  const handleDownloadTemplate = async () => {
    setDownloading({ loading: true, type: 'template' });
    axiosInstance()
      .get(`/import-export/template${selectResource ? `?resource=${selectResource}` : ''}`, {
        responseType: 'arraybuffer'
      })
      .then((response) => {
        setDownloading({ loading: false, type: null });
        const fileName = response.headers['content-disposition'].split('filename=')[1];
        downloadExcel(response.data, fileName);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Exported to excel successfully.'
        });
      })
      .catch((err) => {
        setDownloading({ loading: false, type: null });
        toastConfig.setToastConfig(err);
      });
  };

  const handleCustomImport = async (e) => {
    let files = e.target.files[0];
    setExcelUploadProgress(0);
    let formData = new FormData();
    formData.append('file', files);
    let uploadUrl = `/import-export/custom-import${selectResource ? `?resource=${selectResource}` : ''}`;
    setImgUploading(true);
    if (uploadingImageOrFileProgress) {
      setUploadingImageOrFileProgress(1);
    }
    await axiosInstance()
      .post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setExcelUploadProgress(completedPercent);
          if (uploadingImageOrFileProgress) {
            setUploadingImageOrFileProgress(completedPercent);
          }
          if (completedPercent === 100) {
            setTimeout(() => {
              setExcelUploadProgress(0);
              if (uploadingImageOrFileProgress) {
                setUploadingImageOrFileProgress(0);
              }
            }, 4000);
          }
        }
      })
      .then(({ data }) => {
        setImgUploading(false);
        let customHeader = data.data.CustomFileHeaders;
        setFile(data.data.file);
        customHeader = customHeader.reduce((result, curr) => {
          if (curr == null) {
            return result;
          }
          result.push({ value: curr, label: curr });
          return result;
        }, []);
        let templateHeader = data.data.TemplateHeaders;
        templateHeader = templateHeader.reduce((result, curr) => {
          if (curr == null) {
            return result;
          }
          result.push({ value: curr, label: curr });
          return result;
        }, []);

        setSelectCustomHeader(customHeader);
        setSelectTemplateHeader(templateHeader);
        setCustomImportDialog(true);
        fetchLogs();
      })
      .catch((err) => {
        setImgUploading(false);
        setToastConfig(err);
        setExcelUploadProgress(0);
        if (uploadingImageOrFileProgress) {
          setUploadingImageOrFileProgress(0);
        }
      });
  };

  const ActionsRenderer = {
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
        <HtmlTooltip
          title={row?.original?.status === 'Complete' || row?.original?.status === 'Partial Complete' ? 'Download' : 'Download Not available'}
        >
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                if (row?.original?.status === 'Complete' || row?.original?.status === 'Partial Complete') {
                  handleDownloadFile(row?.original?._id);
                }
              }}
            >
              <GetApp
                color={row?.original?.status === 'Complete' || row?.original?.status === 'Partial Complete' ? 'secondary' : 'disabled'}
                fontSize="small"
              />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const handleDownloadFile = (fileId) => {
    setDownloading({ loading: true, type: 'file' });
    axiosInstance()
      .get(`/import-export/download-file/${fileId}`, {
        responseType: 'arraybuffer'
      })
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

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ ...routes.importExport, title: resources?.importExport?.titlePlural }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Box pb={2}>
          <Autocomplete
            id="export-resources"
            style={{ width: '300px' }}
            options={Object.keys(sidebarResource)?.map((key) => sidebarResource[key])}
            renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" size="small" required={true} />}
            getOptionLabel={(option) => option}
            onChange={(e, val) => {
              setSelectResource(val);
            }}
          />
        </Box>

        <Grid container xs={12} lg={12} md={12} style={{ maxWidth: '100%', justifyContent: 'space-between' }}>
          <Grid container spacing={2} xs={8} lg={8} md={8}>
            <Grid item>
              <input
                id={`file`}
                name={`file`}
                onChange={handleImportFile}
                style={{ display: 'none' }}
                onClick={(e: any) => (e.target.value = null)}
                type="file"
                accept=".xlsx,.csv"
                disabled={isImgUploading || !selectResource}
              />
              <label htmlFor={`file`}>
                <Button size="small" variant="outlined" component="span" disabled={isImgUploading || !selectResource} startIcon={<AiOutlineImport />}>
                  Import from Excel
                </Button>
              </label>
              {isImgUploading && (
                <>
                  <CircularProgress variant="determinate" value={excelUploadProgress} size={30} />
                  <Box>
                    <Typography variant="caption" component="div" color="textSecondary">{`${excelUploadProgress}%`}</Typography>
                  </Box>
                </>
              )}
            </Grid>
            <Grid item>
              <Button
                size="small"
                variant="outlined"
                component="span"
                disabled={isImgUploading || !selectResource}
                startIcon={<AiOutlineExport />}
                onClick={() => {
                  handleDownloadTemplate();
                }}
              >
                Download Template {downloading.loading && downloading.type === 'template' && <CircularProgress size={20} />}
              </Button>
            </Grid>
            <Grid item>
              <Button
                type="button"
                size="small"
                color="primary"
                variant="outlined"
                onClick={handleExportExcel}
                startIcon={<AiOutlineExport />}
                disabled={selectResource == null}
              >
                Export to Excel {downloading.loading && downloading.type === 'export' && <CircularProgress size={20} />}
              </Button>
            </Grid>
          </Grid>
          <Grid container xs={4} lg={4} md={4} justify="flex-end">
            <Button
              size="small"
              variant="outlined"
              component="span"
              disabled={!selectResource}
              startIcon={<AiOutlineImport />}
              onClick={() => {
                setCustomImportDialog(true);
              }}
            >
              Custom Import
            </Button>
          </Grid>
        </Grid>
        <Box>
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchLogs}
              isClientSideGrid={true}
              hideSelection={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
          {customImportDialog && (
            <CustomImport
              open={customImportDialog}
              refreshGrid={fetchLogs}
              handleFileImport={handleCustomImport}
              isImgUploading={isImgUploading}
              handleClose={() => {
                setSelectTemplateHeader(null);
                setCustomImportDialog(false);
              }}
              resource={selectResource ? selectResource : ''}
              customImportHeader={selectCustomHeader}
              templateImportHeader={selectTemplateHeader}
              file={file}
              excelUploadProgress={excelUploadProgress}
            />
          )}
        </Box>
      </CustomContainer>
    </Fragment>
  );
};

export default ImportExport;
