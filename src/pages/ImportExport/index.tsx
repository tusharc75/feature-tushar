import { useState, useEffect, useContext, Fragment } from 'react';
import Layout from '../../components/Layout';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { Box, Container, Grid, Paper, Button, CircularProgress, Card, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { DataGrid } from '@material-ui/data-grid';
import { AiOutlineUpload } from 'react-icons/all';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { documentUploadMaxSize, resourceNames, RESOURCE_LABEL } from '../../constants/helpers';
import CustomContainer from 'src/components/CustomContainer';

const BrandBackup = () => {
  const [brandOptions, setBrandOptions] = useState([]);
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

  useEffect(() => {
    fetchImportExportHistory();
  }, [selectResource]);

  const fetchImportExportHistory = async () => {
    axiosInstance()
      .get(`/import-export/${selectResource ? `?resource=${selectResource}` : ''}`)
      .then((data) => {
        console.log(data);
        setRows(data?.data?.data?.filter((x) => x?.type === 'Export'));
        setRowsRestore(data?.data?.data?.filter((x) => x?.type === 'Import'));
      })
      .catch((err) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: err?.error || 'Something went wrong'
        });
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
        // console.log(data);
        setExcelUploadUrl(data?.url);
        setImgUploading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'File uploaded successfully'
        });
        // fetchImportHistory();
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

  // const handleImportExcel = async () => {
  //   const data = {
  //     url: excelUploadUrl,
  //     resource: selectResource
  //   };
  //   await axiosInstance()
  //     .post(`/import-export/import`, data)
  //     .then(({ data }) => {
  //       fetchImportExportHistory();
  //       toastConfig.setToastConfig({
  //         open: true,
  //         type: 'success',
  //         message: 'File imported successfully'
  //       });
  //       // fetchImportHistory();
  //     })
  //     .catch((err) => {
  //       toastConfig.setToastConfig({
  //         open: true,
  //         type: err?.type || 'error',
  //         message: err?.message || 'Something went wrong'
  //       });
  //     });
  // };

  const handleExportExcel = async () => {
    axiosInstance()
      .get(`/import-export/export${selectResource ? `?resource=${selectResource}` : ''}`)
      .then((data) => {
        fetchImportExportHistory();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Data Export Initiated'
        });
      })
      .catch((err) => {});
  };

  const columns = [
    {
      field: 'resource',
      headerName: 'Resource',
      width: 200,
      valueGetter: (params) => {
        return params?.row?.resource;
      }
    },
    {
      field: 'date',
      headerName: 'Date & Time',
      width: 200,
      valueGetter: (params) => {
        return params.row.date.substring(0, 10) + ' ' + params.row.date.substring(11, 19);
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      valueGetter: (params) => {
        return params?.row?.status;
      }
    },
    {
      field: 'download',
      headerName: 'Action',
      width: 170,
      renderCell: (params) => {
        return (
          <>
            <Button
              onClick={() => {
                handleDownloadFile(params.row.fileName);
                setFileName(params.row.fileName);
              }}
              variant="contained"
              color="primary"
              size="small"
              disabled={params.row.status !== 'Complete'}
            >
              {downloading && fileName === params.row.fileName ? (
                <>
                  <CircularProgress color="inherit" size={14} style={{ marginRight: '10px' }} />
                  Downloading ...{' '}
                </>
              ) : (
                '  Download'
              )}
            </Button>
          </>
        );
      }
    }
  ];

  const columns2 = [
    {
      field: 'resource',
      headerName: 'Resource',
      width: 200,
      valueGetter: (params) => {
        return params?.row?.resource;
      }
    },
    {
      field: 'date',
      headerName: 'Date & Time',
      width: 400,
      valueGetter: (params) => {
        return params.row.date.substring(0, 10) + ' ' + params.row.date.substring(11, 19);
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      valueGetter: (params) => {
        return params?.row?.status;
      }
    }
  ];

  // const handleRestoreFile = (fileName) => {
  //   setRestoring(true);
  //   const body = {
  //     fileName: fileName
  //   };
  //   axiosInstance()
  //     .post(`/export/import-json`, body)
  //     .then(({ data: { data } }) => {
  //       setRestoring(false);
  //       // fetchExportHistory();
  //       toastConfig.setToastConfig({
  //         open: true,
  //         type: 'success',
  //         message: 'Restored  successfully'
  //       });
  //     })
  //     .catch((error) => {
  //       setRestoring(false);
  //       console.error(error, 'error');
  //       toastConfig.setToastConfig(error);
  //     });
  // };

  // const handleBackup = () => {
  //   setSending(true);
  //   axiosInstance()
  //     .get(`/export/export-json/${selectedBrand.id}`)
  //     .then(({ data: { data } }) => {
  //       setSending(false);
  //       // fetchExportHistory();
  //       toastConfig.setToastConfig({
  //         open: true,
  //         type: 'success',
  //         message: 'Backup created successfully'
  //       });
  //     })
  //     .catch((error) => {
  //       setSending(false);
  //       console.error(error, 'error');
  //       toastConfig.setToastConfig(error);
  //     });
  // };

  const handleDownloadFile = (fileName) => {
    setDownloading(true);
    const body = {
      fileName: fileName,
      brand: selectedBrand.id
    };
    axiosInstance()
      .post(`/export/download-file`, body)
      .then((data) => {
        setDownloading(false);
        let fileText = data?.data?.fileData;
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

  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  return (
    <Layout>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.importExport]} />
          </Grid>
        </Grid>
        <CustomContainer styles={{ paddingLeft: '0rem' }}>
          <Box style={{ marginTop: '1.5rem', marginLeft: '1rem', marginRight: '1rem' }}>
            <Grid container xs={12} lg={5} md={5} style={{ marginBottom: '0.5rem' }}>
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
            <Grid container spacing={2}>
              <Grid item xs={12} lg={6} md={6}>
                <Box>
                  <Card variant="outlined">
                    <Box p={2}>
                      <span className="listingHeader">Export File</span>
                    </Box>
                    <Box p={2}>
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
                    </Box>
                    <Box p={2}>
                      <span className="listingHeader">{selectResource ? selectResource : 'All'} Export History</span>
                      <br />
                      <div style={{ height: 200, width: '100%' }}>
                        <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} getRowId={(row) => row._id} />
                      </div>
                    </Box>
                  </Card>
                </Box>
              </Grid>
              <Grid item xs={12} lg={6} md={6}>
                <Box>
                  <Card variant="outlined">
                    <Box p={2}>
                      <span className="listingHeader">Import File</span>
                    </Box>

                    <Box style={{ display: 'flex', gap: '1rem' }}>
                      <Box p={2}>
                        {isImgUploading && (
                          <>
                            <CircularProgress variant="determinate" value={excelUploadProgress} />
                            <Box>
                              <Typography variant="caption" component="div" color="textSecondary">{`${excelUploadProgress}%`}</Typography>
                            </Box>
                          </>
                        )}
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
                          <Button size="small" variant="outlined" component="span" disabled={isImgUploading} startIcon={<AiOutlineUpload />}>
                            Import Data
                          </Button>
                        </label>
                      </Box>
                    </Box>
                    <Box p={2}>
                      <span className="listingHeader">{selectResource ? selectResource : 'All'} Import History</span>
                      <br />
                      <div style={{ height: 200, width: '100%' }}>
                        <DataGrid rows={rowsRestore} columns={columns2} pageSize={5} rowsPerPageOptions={[5]} getRowId={(row) => row._id} />
                      </div>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CustomContainer>
      </Fragment>
    </Layout>
  );
};

export default BrandBackup;
