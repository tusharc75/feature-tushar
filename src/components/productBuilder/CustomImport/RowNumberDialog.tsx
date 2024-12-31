import { Box, Dialog, IconButton, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomDialogTransition } from 'src/constants/helpers';
import { read } from 'xlsx';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import ShowMissedOrExtraColumn from 'src/components/productBuilder/CustomImport/ShowMissedOrExtraColumn';

const RowNumberDialog = ({ handleClose, onSuccess, file, resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({ cell: [] });
  const [sheetNames, setSheetNames] = useState([]);
  const [excelMappingData, setExcelMappingData] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [confirmationDelete, setConfirmationDelete] = useState({ open: false, data: null });

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        let readData = read(data, { type: 'array' });
        const wsname = readData?.SheetNames;
        setSheetNames(wsname);
        setInitialValues({ cell: [{ sheetName: wsname[0], startRowCell: '', endRowCell: '', headerRow: '1' }] });
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  useEffect(() => {
    fetchExcelMappingView();
  }, []);

  const addRemove = (values, type, index) => {
    let data = values?.cell || [];
    if (type === 'add') {
      data.splice(index, 0, {
        sheetName: data[0]?.sheetName,
        startRowCell: '',
        endRowCell: '',
        headerRow: '1'
      });
    } else {
      data.splice(index, 1);
    }
    setInitialValues({ cell: [...data] });
  };

  const fetchExcelMappingView = () => {
    axiosInstance()
      .get(`/excel-mapping?resource=${resource}`)
      .then(({ data: { data } }) => {
        setExcelMappingData(data?.filter((d) => d?.access === 'everyone' || (d?.access === 'private' && d?.user === user?.user?._id)));
      })
      .catch((error) => {});
  };

  const deleteExcelMappingView = () => {
    axiosInstance()
      .put(`/excel-mapping/remove`, { ids: confirmationDelete.data?.map((d) => d?._id) })
      .then(({ data }) => {
        fetchExcelMappingView();
        setConfirmationDelete({ open: false, data: null });
        setSelectedView(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  useEffect(() => {
    let cell = [{ sheetName: '', startRowCell: '', endRowCell: '', headerRow: '1' }];
    if (selectedView) {
      cell = selectedView?.sheet;
    }
    setInitialValues({ cell: cell });
  }, [selectedView]);

  const handleSave = (values) => {
    onSuccess(values?.cell, selectedView);
  };

  return (
    <Dialog
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      disableEnforceFocus
      maxWidth={'md'}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <Formik initialValues={initialValues} onSubmit={handleSave} enableReinitialize>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader title={'Enter Excel Row Number'} showRequiredLabel={false} onClose={handleClose}></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <Box mb={2} width={350} display={'flex'} alignItems={'center'}>
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={excelMappingData}
                      getOptionLabel={(option) => option?.name || ''}
                      isOptionEqualToValue={(option: any, val) => option?._id === val}
                      value={selectedView}
                      onChange={(event: any, newValue: any) => {
                        setSelectedView(newValue ? newValue : null);
                      }}
                      renderOption={(props, option, state, ownerState) => {
                        const { key, ...optionProps } = props;
                        return (
                          <Box
                            key={key}
                            component="li"
                            {...optionProps}
                            display={'flex'}
                            alignItems={'center'}
                            justifyContent={'space-between'}
                            width={'100%'}
                          >
                            <span style={{ width: 'calc(100% - 71px)' }}>{ownerState.getOptionLabel(option)}</span>
                            <Box>
                              <HtmlTooltip title={'Delete'} placement="top" arrow enterTouchDelay={0}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setConfirmationDelete({ open: true, data: [option] });
                                  }}
                                >
                                  <RiDeleteBin6Fill />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                          </Box>
                        );
                      }}
                      id="select-view"
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" size={'small'} fullWidth label="Select Excel Mapping" variant="outlined" />
                      )}
                    />
                    <Box ml={2}>
                      <ShowMissedOrExtraColumn view={selectedView} file={file} />
                    </Box>
                  </Box>
                  <FieldArray
                    name="cell"
                    render={(arrayHelpers) =>
                      values?.cell?.map((data, index) => {
                        return (
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ md: 11, lg: 11 }}>
                              <Grid container spacing={2}>
                                <Grid size={{ sm: 12, xs: 12, md: 3, lg: 3 }}>
                                  <Autocomplete
                                    options={sheetNames}
                                    disableClearable
                                    isOptionEqualToValue={(option: any, val) => option === val}
                                    value={data?.sheetName}
                                    onChange={(e, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.cell[index],
                                        ['sheetName']: val
                                      });
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        margin="dense"
                                        size="small"
                                        name="sheetName"
                                        label="Sheet Name"
                                        variant="outlined"
                                        required
                                        fullWidth
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid size={{ sm: 12, xs: 12, md: 3, lg: 3 }}>
                                  <TextField
                                    variant="outlined"
                                    type="text"
                                    label={'Start Row Cell'}
                                    name="startRowCell"
                                    fullWidth
                                    margin="dense"
                                    size={'small'}
                                    value={data['startRowCell']}
                                    onChange={(e) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.cell[index],
                                        ['startRowCell']: e.target.value?.toUpperCase()
                                      });
                                    }}
                                  />
                                </Grid>
                                <Grid size={{ sm: 12, xs: 12, md: 3, lg: 3 }}>
                                  <TextField
                                    variant="outlined"
                                    type="text"
                                    label={'End Row Last Cell'}
                                    name="endRowCell"
                                    fullWidth
                                    margin="dense"
                                    size={'small'}
                                    value={data['endRowCell']}
                                    onChange={(e) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.cell[index],
                                        ['endRowCell']: e.target.value?.toUpperCase()
                                      });
                                    }}
                                  />
                                </Grid>
                                <Grid size={{ sm: 12, xs: 12, md: 3, lg: 3 }}>
                                  <Autocomplete
                                    options={['1', '2']}
                                    disableClearable
                                    isOptionEqualToValue={(option: any, val) => option === val}
                                    value={data?.headerRow}
                                    onChange={(e, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.cell[index],
                                        ['headerRow']: val
                                      });
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        margin="dense"
                                        size="small"
                                        name="headerRow"
                                        label="Header Row"
                                        variant="outlined"
                                        required
                                        fullWidth
                                      />
                                    )}
                                  />
                                </Grid>
                              </Grid>
                            </Grid>
                            <Grid size={{ md: 1, lg: 1 }}>
                              <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
                                <HtmlTooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    aria-label="remove"
                                    disabled={index === 0 && values?.cell?.length === 1}
                                    onClick={() => addRemove(values, 'remove', index)}
                                  >
                                    <RemoveCircleOutlineIcon fontSize="small" color="primary" />
                                  </IconButton>
                                </HtmlTooltip>
                                <HtmlTooltip title="Add">
                                  <IconButton size="small" aria-label="add" onClick={() => addRemove(values, 'add', index + 1)}>
                                    <AddCircleOutlineIcon fontSize="small" color="primary" />
                                  </IconButton>
                                </HtmlTooltip>
                              </Box>
                            </Grid>
                          </Grid>
                        );
                      })
                    }
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton buttonType="theme" onClick={submitForm}>
                Submit
              </ThemeButton>
            </CustomDialogFooter>
            {confirmationDelete.open && (
              <ConfirmationDialog
                open={true}
                message={`Are you sure you want to delete ${confirmationDelete?.data[0]?.name} ?`}
                onClose={() => setConfirmationDelete({ open: false, data: null })}
                onOk={deleteExcelMappingView}
              />
            )}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default RowNumberDialog;
