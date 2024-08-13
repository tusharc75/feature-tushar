import { Button, Dialog, Grid, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { read, utils } from 'xlsx';

const RowNumberDialog = ({ handleClose, onSuccess, file }) => {
  const [initialValues, setInitialValues] = useState({ fromRow: 0, toRow: 0 });
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState(null);

  const handleSave = (values) => {
    onSuccess(values, selectedSheetName);
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        let readedData = read(data, { type: 'array' });
        const wsname = readedData.SheetNames;
        setSheetNames(wsname);
        setSelectedSheetName(wsname[0]);
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  return (
    <Dialog
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      disableEnforceFocus
      maxWidth={'xs'}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <Formik initialValues={initialValues} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader title={'Enter Excel Row Number'} showRequiredLabel={false} onClose={handleClose}></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Grid container spacing={2}>
                  <Grid item sm={12} xs={12} md={12} lg={12}>
                    <Autocomplete
                      options={sheetNames}
                      getOptionSelected={(option: any, val) => option === val}
                      value={selectedSheetName}
                      onChange={(e, val) => {
                        setSelectedSheetName(val);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" name="sheetName" label="Sheet Name" variant="outlined" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item sm={12} xs={12} md={12} lg={12}>
                    <TextField
                      variant="outlined"
                      type="number"
                      label={'From Row Number'}
                      name="fromRow"
                      fullWidth
                      margin="dense"
                      size={'small'}
                      value={values['fromRow']}
                      onChange={(e) => {
                        setFieldValue('fromRow', +e.target.value >= 0 ? +e.target.value : 0);
                      }}
                    />
                  </Grid>
                  <Grid item sm={12} xs={12} md={12} lg={12}>
                    <TextField
                      variant="outlined"
                      type="number"
                      label={'To Row Number'}
                      name="toRow"
                      fullWidth
                      margin="dense"
                      size={'small'}
                      value={values['toRow']}
                      onChange={(e) => {
                        setFieldValue('toRow', +e.target.value >= 0 ? +e.target.value : 0);
                      }}
                    />
                  </Grid>
                </Grid>
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
