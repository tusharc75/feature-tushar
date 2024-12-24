import { useContext, useState } from 'react';
import {
  Dialog,
  Button,
  Grid,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Table,
  Box,
  Typography,
  CircularProgress,
  Paper
} from '@mui/material';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomButton from '../../components/Helpers/CustomButton';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { AiOutlineImport } from 'react-icons/ai';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

export const CustomImport = ({
  open,
  handleClose,
  resource,
  customImportHeader,
  templateImportHeader,
  file,
  isImgUploading,
  handleFileImport,
  excelUploadProgress,
  refreshGrid
}) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const [keyValue, setKeyValue] = useState(() => {
    let _keyValue = [];
    customImportHeader?.forEach((_value) => {
      if (templateImportHeader?.find((templateImportHeader) => templateImportHeader?.value === _value?.value) ? true : false) {
        _keyValue = [..._keyValue, { templateImportHeader: _value?.value, customImportHeader: _value?.value }];
      }
    });
    return _keyValue;
  });
  const handleCustomImport = () => {
    setLoading(true);
    let body = {
      resource: resource,
      file: file,
      keyValue: keyValue
    };
    axiosInstance()
      .post(`/import-export/custom-import/headers?resource=${resource}`, body)
      .then((res) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: 'File uploaded successfully'
        });
        handleClose();
        refreshGrid();
      })
      .catch((err) => {
        setToastConfig({
          open: true,
          type: 'error',
          message: 'An error occurred while uploading the file'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <Dialog open={open} onClose={() => handleClose()} TransitionComponent={CustomDialogTransition} fullScreen={true} fullWidth maxWidth="md">
        <CustomDialogHeader title="Custom File Import" onClose={() => handleClose()} />
        <CustomDialogContent>
          <Grid container xs={12} lg={12} md={12} spacing={1} style={{ marginTop: '10px' }}>
            <Grid item>
              <input
                id={`customImportFile`}
                name={`customImportFile`}
                onChange={handleFileImport}
                style={{ display: 'none' }}
                onClick={(e: any) => (e.target.value = null)}
                type="file"
                accept=".xlsx,.csv"
              />
              <label htmlFor={`customImportFile`}>
                <Button size="medium" variant="outlined" component="span" disabled={isImgUploading} startIcon={<AiOutlineImport />}>
                  Import File
                </Button>
              </label>
            </Grid>
            <Grid item style={{ display: 'flex' }}>
              {isImgUploading && (
                <Grid container spacing={1}>
                  <Grid item>
                    <CircularProgress variant="determinate" value={excelUploadProgress} size={30} />
                  </Grid>
                  <Grid item>
                    <Box>
                      <Typography variant="caption" component="div" color="textSecondary">{`${excelUploadProgress}%`}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
          {isImgUploading ? (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          ) : (
            templateImportHeader?.length > 0 && (
              <TableContainer style={{ marginTop: '16px' }} component={Paper}>
                <Table aria-label="customized table">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: '50%' }}>System Columns</TableCell>
                      <TableCell style={{ width: '50%' }}>Imported Excel Columns</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateImportHeader?.map((_key) => (
                      <TableRow key={_key?.value}>
                        <TableCell component="th" scope="row">
                          {' '}
                          {_key?.label}{' '}
                        </TableCell>
                        <TableCell align="right">
                          <Autocomplete
                            size="small"
                            id={_key?.value}
                            options={customImportHeader}
                            getOptionLabel={(option) => option?.label}
                            value={customImportHeader.find((_value) => {
                              if (_value?.value === _key?.value) {
                                return true;
                              }
                              return null;
                            })}
                            onChange={(event, newValue) =>
                              setKeyValue([...keyValue, { templateImportHeader: _key?.value, customImportHeader: newValue?.value }])
                            }
                            style={{ maxWidth: '500px' }}
                            renderInput={(params) => <TextField {...params} label="" variant="outlined" />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button color="primary" size="small" onClick={handleClose}>
            Cancel
          </Button>
          <CustomButton onClick={handleCustomImport} variant="contained" color="primary" disabled={loading} loading={loading}>
            Save
          </CustomButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};
