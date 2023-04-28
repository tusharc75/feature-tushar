import { Box, Button, Checkbox, Dialog, FormControl, Grid, TextField } from '@material-ui/core';
import React, { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, quotation } from 'src/constants/helpers';
import CustomButton from '../Helpers/CustomButton';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
function PreviewDownload({ resource, referenceId, columns }) {
  const toastConfig = useContext(CustomToastContext);
  const columnFilter = ['Action'];
  const allColumn = columns?.filter((d) => !columnFilter.includes(d.Header))?.map((d) => d.Header);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [loading, setLoading] = useState(null);
  const [downlodingFile, setDownlodingFile] = useState(null);
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState(['Select All', ...allColumn]);
  const [excelArrangeColumnLoading, setExcelArrangeColumnLoading] = useState(false);
  const [showExcelArrangeColumns, setShowExcelArrangeColumns] = useState({ open: false, type: '' });

  const handleViewPdf = (type, PDFType, visibleColumns) => {
    let tempColumns = columns
      .filter((d) => visibleColumns?.includes(d?.Header) && d?.Header !== 'Action')
      .map((d) => {
        if (d?.accessor === 'qtyDisplay') {
          return 'qty';
        } else {
          return d?.accessor.split('_')[0];
        }
      });
    if (PDFType === 'Regular') {
      setLoading('Regular');
    } else {
      setLoading('Detail');
    }
    axiosInstance()
      .get(
        PDFType === 'Detail'
          ? `/pdf/${referenceId}/detail?resource=${resource}&columns=${tempColumns}`
          : `/pdf/${referenceId}?resource=${resource}&columns=${tempColumns}`
      )
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            setLoading(null);
            setExcelArrangeColumnLoading(false);
            setShowExcelArrangeColumns({ open: false, type: '' });
            if (type === 'Download') {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Quotation-${resource}.pdf`);
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
            disabled={loading === 'view'}
            onClick={(e) => {
              setDownlodingFile('Preview');
              setShowExcelArrangeColumns({ open: true, type: 'PDF' });
            }}
          >
            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : loading === 'view' ? 'Please wait...' : 'Preview'}
          </Button>

          <Button
            className="btn-outline-v1"
            variant="outlined"
            color="primary"
            type="button"
            size="small"
            startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
            disabled={loading === 'download'}
            onClick={(e) => {
              setDownlodingFile('Download');
              setShowExcelArrangeColumns({ open: true, type: 'PDF' });
            }}
          >
            {isMobile && !isTablet ? <IoMdDownload size={20} /> : loading === 'download' ? 'Please wait...' : 'Download'}
          </Button>
        </Box>
      </Box>
      {showExcelArrangeColumns.open && (
        <Dialog
          open={showExcelArrangeColumns.open}
          aria-labelledby="customized-dialog-title"
          maxWidth="sm"
          onClose={() => {
            setShowExcelArrangeColumns({ open: false, type: '' });
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title={`Visible Columns in ${showExcelArrangeColumns.type}`}
            onClose={() => {
              setShowExcelArrangeColumns({ open: false, type: '' });
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <Grid container justify="space-between" alignItems="center">
              <Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    id="demo-mutiple-chip"
                    // disabled={!allowedToEdit}
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
                        setVisibleColumnsExcel(allColumn.filter((d) => val.includes(d)));
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
                      <TextField {...params} variant="outlined" label={`Visible Columns in ${showExcelArrangeColumns.type}`} placeholder="Select " />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            {
              <>
                <CustomButton
                  variant="contained"
                  color="primary"
                  size="small"
                  loading={loading === 'Regular' || excelArrangeColumnLoading}
                  disabled={loading || visibleColumnsExcel.length === 0}
                  onClick={(e) => {
                    handleViewPdf(downlodingFile, 'Regular', visibleColumnsExcel);
                  }}
                >
                  Regular
                </CustomButton>
                <CustomButton
                  variant="contained"
                  color="primary"
                  size="small"
                  loading={loading === 'Detail' || excelArrangeColumnLoading}
                  disabled={loading || visibleColumnsExcel.length === 0}
                  onClick={(e) => {
                    handleViewPdf(downlodingFile, 'Detail', visibleColumnsExcel);
                  }}
                >
                  Detail
                </CustomButton>
              </>
            }
          </CustomDialogFooter>
        </Dialog>
      )}
    </Box>
  );
}

export default PreviewDownload;
