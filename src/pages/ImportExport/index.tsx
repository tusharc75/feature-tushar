import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { Box, Grid, Button, CircularProgress, Typography, IconButton, Tooltip } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { AiOutlineExport, AiOutlineImport } from 'react-icons/all';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { downloadExcel, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomContainer from 'src/components/CustomContainer';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateTimeRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { GetApp } from '@material-ui/icons';

const ImportExport = () => {

  const toastConfig = useContext(CustomToastContext);
  const { setToastConfig } = useContext(CustomToastContext);
  const [excelUploadProgress, setExcelUploadProgress] = useState(0);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);

  const [isImgUploading, setImgUploading] = useState(false);
  const [downloading, setDownloading] = useState({ loading: false, type: null });
  const [selectResource, setSelectResource] = useState(null);
  const [loading, setLoading] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, page, limit, pageSizes, appendRows } = state;


  useEffect(() => {
    fetchLogs();
  }, [ selectResource, page, limit ]);

  const fetchLogs = async () => {
    setLoading(true);
    axiosInstance()
      .get(`/import-export/logs${selectResource ? `?resource=${selectResource}` : ''}`)
      .then(({ data: {data} }) => {
        const count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: [],
            count: 0,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        // dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: err?.error || 'Something went wrong'
        });
        setLoading(false);
      });
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
        responseType: 'arraybuffer',
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

  const column = [
    {
      field: 'type',
      headerName: 'Type',
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'resource',
      headerName: 'Resource',
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'date',
      headerName: 'Date & Time',
      cellRenderer: 'dateTimeRenderer'
    },
    {
      field: 'status',
      headerName: 'Status',
      cellRenderer: 'commonRenderer'
    }
  ];

  const ActionRenderer = (params) => {  
    return (
      <>
        <Tooltip
          title={
            (params?.data?.status === 'Complete' || params?.data?.status === 'Partial Complete')
              ? 'Download'
              : 'Download Not available'
          }
        >
          <IconButton
            size="small"
            color="inherit"
            onClick={() => {
              if (params?.data?.status === 'Complete' || params?.data?.status === 'Partial Complete') {
                handleDownloadFile(params.data._id);
              }
            }}
          >
            <GetApp
              color={
                (params?.data?.status === 'Complete' || params?.data?.status === 'Partial Complete')
                  ? 'secondary'
                  : 'disabled'
              }
              fontSize="small"
            />
          </IconButton>
        </Tooltip>
      </>
    );
  };
  

  const frameworkComponents = {
    dateTimeRenderer: DateTimeRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: ActionRenderer
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
          <CustomBreadCrumbs routes={[routes.importExport]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Box pb={2}>
          <Autocomplete
            id="export-resources"
            style={{ width: '300px' }}
            options={Object.keys(sidebarResource)?.map((key) => sidebarResource[key])}
            renderInput={(params) =>
              <TextField {...params}
                variant="outlined"
                label="Resource"
                margin="dense"
                required={true} />}
            getOptionLabel={(option) => option}
            onChange={(e, val) => {
              setSelectResource(val);
            }}
          />
        </Box>
        <Grid container spacing={2} xs={12} lg={12} md={12}>
          <Grid item>
            <input
              id={`file`}
              name={`file`}
              onChange={handleImportFile}
              style={{ display: 'none' }}
              onClick={(e: any) => (e.target.value = null)}
              type="file"
              accept=".xlsx,.csv"
            />
            <label htmlFor={`file`}>
              <Button
                size="small"
                variant="outlined"
                component="span"
                disabled={isImgUploading || !selectResource}
                startIcon={<AiOutlineImport />}
              >
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
              Export to Excel {
                downloading.loading && downloading.type === 'export' && <CircularProgress size={20} />
              }
            </Button>
          </Grid>
        </Grid>
        <Box>
          <CustomAgGrid
            columns={column}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            isClientSideGrid={true}
            allowAction={true}
            actionWidth={150}
            loading={loading}
            allowSelection={false}
            refreshGrid={fetchLogs}
          />
        </Box>
      </CustomContainer>
    </Fragment>
  );
};

export default ImportExport;
