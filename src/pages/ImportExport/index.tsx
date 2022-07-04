import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import Layout from '../../components/Layout';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { Box, Container, Grid, Paper, Button, CircularProgress, Card, Typography, Tabs, Tab } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { DataGrid } from '@material-ui/data-grid';
import { AiOutlineImport, AiOutlineUpload, BiExport, BiImport } from 'react-icons/all';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { documentUploadMaxSize, resourceNames, RESOURCE_LABEL } from '../../constants/helpers';
import CustomContainer from 'src/components/CustomContainer';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateTimeRenderer, NumberRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
// import { TabPanel } from '@material-ui/lab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}
const BrandBackup = () => {
  const [brandOptions, setBrandOptions] = useState([]);
  const [rowsExport, setRowsExport] = useState([]);
  const [rowsImport, setRowsImport] = useState([]);
  const [rows, setRows] = useState([]);
  const [rowsRestore, setRowsRestore] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const { setToastConfig } = useContext(CustomToastContext);
  const [excelUploadProgress, setExcelUploadProgress] = useState(0);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<any>({});
  const [sending, setSending] = useState(false);
  const [isImgUploading, setImgUploading] = useState(false);
  const [isRestoring, setRestoring] = useState(false);
  const [fileName, setFileName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [excelUploadUrl, setExcelUploadUrl] = useState(null);
  const [selectResource, setSelectResource] = useState(null);
  const fileUploadMaxSize = { ...documentUploadMaxSize };
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    tabValue === 0 ? fetchAllImportHistory() : fetchAllExportHistory();
  }, [selectResource, tabValue]);

  const fetchAllExportHistory = async () => {
    setLoading(true);
    axiosInstance()
      .get(`/import-export/all-export-data${selectResource ? `?resource=${selectResource}` : ''}`)
      .then((data) => {
        console.log(data?.data?.data);
        setRowsExport(data?.data?.data);
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
  const fetchAllImportHistory = async () => {
    setLoading(true);
    axiosInstance()
      .get(`/import-export/all-import-data${selectResource ? `?resource=${selectResource}` : ''}`)
      .then((data) => {
        console.log(data?.data?.data);
        setRowsImport(data?.data?.data);
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
        setExcelUploadUrl(data?.url);
        setImgUploading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'File uploaded successfully'
        });
        fetchAllImportHistory();
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
    axiosInstance()
      .get(`/import-export/export${selectResource ? `?resource=${selectResource}` : ''}`)
      .then((data) => {
        fetchAllExportHistory();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Data Export Initiated'
        });
      })
      .catch((err) => {});
  };

  const exportColumn = [
    {
      field: 'resource',
      headerName: 'Resource',
      width: 200,
      cellRenderer: 'NumberRenderer'
    },
    {
      field: 'date',
      headerName: 'Date & Time',
      width: 200,
      cellRenderer: 'DateTimeRenderer'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      cellRenderer: 'CommonRenderer'
    }
    // {
    //   field: 'fileName',
    //   headerName: 'Action',
    //   width: 170,
    //   cellRenderer: (params) => {
    //     return (
    //       <>
    //         <Button
    //           onClick={() => {
    //             handleDownloadFile(params.row._id);
    //             setFileName(params.row._id);
    //           }}
    //           variant="contained"
    //           color="primary"
    //           size="small"
    //           disabled={params.row.status !== 'Complete'}
    //         >
    //           {downloading && fileName === params.row.fileName ? (
    //             <>
    //               <CircularProgress color="inherit" size={14} style={{ marginRight: '10px' }} />
    //               Downloading ...{' '}
    //             </>
    //           ) : (
    //             '  Download'
    //           )}
    //         </Button>
    //       </>
    //     );
    //   }
    // }
  ];

  const importColumn = [
    {
      field: 'resource',
      headerName: 'Resource',
      show: true,
      primaryField: true,
      disabled: false,
      width: 200,
      cellRenderer: 'NumberRenderer'
      // valueGetter: (params) => {
      //   return params?.row?.resource;
      // }
    },
    {
      field: 'date',
      headerName: 'Date & Time',
      width: 400,
      cellRenderer: 'DateTimeRenderer'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      cellRenderer: 'CommonRenderer'
    }
  ];

  const handleDownloadFile = (fileId) => {
    console.log(fileId);
    setDownloading(true);
    axiosInstance()
      .get(`/import-export/download-file/${fileId}`, {
        responseType: 'arraybuffer'
      })
      .then((data) => {
        setDownloading(false);
        let fileText = data.data;
        const fileName = fileText.headers['content-disposition'].split('filename=')[1];
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
        setDownloading(false);
      });
  };

  function download(filename, arrayBuffer) {
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
      <CustomContainer styles={{ paddingLeft: '0rem' }}>
        <Box>
          <Grid container xs={12} lg={5} md={5} style={{ marginBottom: '0.5rem', marginLeft: '0.5rem' }}>
            <Autocomplete
              id="export-resources"
              options={Object.keys(resourceNames)?.map((key) => resourceNames[key])}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" required={true} />}
              getOptionLabel={(option) => option}
              onChange={(e, val) => {
                setSelectResource(val);
              }}
              fullWidth={true}
            />
          </Grid>
          <Box>
            <>
              <Tabs
                className="quote-tab"
                value={tabValue}
                onChange={handleMainTabChange}
                textColor="primary"
                TabIndicatorProps={{
                  style: {
                    display: 'none'
                  }
                }}
              >
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 1 ? 'white' : '',
                    color: tabValue === 1 ? '#163340' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <BiImport className="mr-1" fontSize="inherit" />
                      Import
                    </div>
                  }
                  {...a11yProps(0)}
                />
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 2 ? 'white' : '',
                    color: tabValue === 2 ? 'blue' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <BiExport className="mr-1" fontSize="inherit" />
                      Export
                    </div>
                  }
                  {...a11yProps(1)}
                />
                <div className={'uio'}> </div>
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Box mt={2} className="bg-white">
                  <Grid container xs={12} lg={5} md={5} style={{ padding: '1rem', paddingTop: 0 }}>
                    <Box style={{ display: 'flex' }}>
                      <Box style={{ marginRight: '0.5rem' }}>
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
                            Import Data
                          </Button>
                        </label>
                      </Box>
                      {isImgUploading && (
                        <>
                          <CircularProgress variant="determinate" value={excelUploadProgress} size={30} />
                          <Box>
                            <Typography variant="caption" component="div" color="textSecondary">{`${excelUploadProgress}%`}</Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Box>
                <CustomAgGrid
                  columns={importColumn}
                  dataRows={rowsImport}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={intialState.rowCount}
                  limit={intialState.limit}
                  pageSizes={intialState.pageSizes}
                  page={intialState.page}
                  isClientSideGrid={true}
                  loading={loading}
                  allowSelection={false}
                  allowAction={false}
                  refreshGrid={fetchAllImportHistory}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box mt={2} className="bg-white">
                  <Grid container xs={12} lg={5} md={5} style={{ padding: '1rem', paddingTop: 0 }}>
                    <Button
                      type="button"
                      size="small"
                      color="primary"
                      variant="contained"
                      onClick={handleExportExcel}
                      disabled={selectResource == null}
                    >
                      Export Data
                    </Button>
                  </Grid>
                </Box>
                <CustomAgGrid
                  columns={exportColumn}
                  dataRows={rowsExport}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={intialState.rowCount}
                  limit={intialState.limit}
                  pageSizes={intialState.pageSizes}
                  page={intialState.page}
                  isClientSideGrid={true}
                  allowAction={true}
                  // actionWidth={150}
                  actionLabel="Action"
                  loading={loading}
                  allowSelection={false}
                  refreshGrid={fetchAllExportHistory}
                />
              </TabPanel>
            </>
          </Box>
        </Box>
      </CustomContainer>
    </Fragment>
  );
};

export default BrandBackup;
