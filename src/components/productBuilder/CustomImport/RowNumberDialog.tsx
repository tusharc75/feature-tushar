import { Box, Button, Dialog, Grid, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { FieldArray, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomDialogTransition } from 'src/constants/helpers';
import { read, utils } from 'xlsx';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

const RowNumberDialog = ({ handleClose, onSuccess, file }) => {
  const [initialValues, setInitialValues] = useState({ cell: [] });
  const [sheetNames, setSheetNames] = useState([]);

  const handleSave = (values) => {
    onSuccess(values?.cell);
  };

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
                  <FieldArray
                    name="cell"
                    render={(arrayHelpers) =>
                      values?.cell?.map((data, index) => {
                        return (
                          <Grid container spacing={2} alignItems="center">
                            <Grid item md={11} lg={11}>
                              <Grid container spacing={2}>
                                <Grid item sm={12} xs={12} md={3} lg={3}>
                                  <Autocomplete
                                    options={sheetNames}
                                    getOptionSelected={(option: any, val) => option === val}
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
                                        fullWidth
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item sm={12} xs={12} md={3} lg={3}>
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
                                <Grid item sm={12} xs={12} md={3} lg={3}>
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
                                <Grid item sm={12} xs={12} md={3} lg={3}>
                                  <Autocomplete
                                    options={['1', '2']}
                                    getOptionSelected={(option: any, val) => option === val}
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
                                        fullWidth
                                      />
                                    )}
                                  />
                                </Grid>
                              </Grid>
                            </Grid>
                            <Grid item md={1} lg={1}>
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
              <Button size="small" onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" onClick={submitForm} variant="contained">
                Submit
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default RowNumberDialog;
