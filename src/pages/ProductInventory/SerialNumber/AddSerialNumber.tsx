import { useState, useContext, Fragment } from 'react';
import { Box, Divider, TextField, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, productInventory } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { Formik, Form } from 'formik';
import Autocomplete from '@mui/material/Autocomplete';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { read, utils, writeFile } from 'xlsx';

const AddSerialNumber = ({ handleClose, handleSucess, product, warehouse, storageLocation, serialNumberCount, productName }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [qty, setQty] = useState(0);

  const handleSubmit = (values) => {
    setLoading(true);
    axiosInstance()
      .post(`${productInventory.api}/add-serial-number/${product}`, { warehouse: warehouse, storageLocation: storageLocation, serialNumber: values?.serialNumber })
      .then(({ data: { data } }) => {
        setLoading(false);
        handleSucess();
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleExport = (qty: number) => {
    let json_data = [...new Array(Number(qty)).keys()].map((_, i) => ({
      Name: productName,
      'Serial Number': ''
    }));
    const header = ['Name', 'Serial Number'];
    const ws = utils.json_to_sheet(json_data);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, 'Serial Numbers.xlsx');
  };

  const handleImport = (setFieldValue: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const f = files[0];
    let reader = new FileReader();

    reader.onload = function (e) {
      const data = e.target?.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const parsedData = utils.sheet_to_json(ws, { header: 1 });

      if (parsedData.length > 1) {
        let tableContent = parsedData.slice(1);
        let serialNumbers = tableContent
          .map((item) => item[1]?.toString().trim())
          .filter((sn) => sn && sn.length > 0);

        console.log(serialNumbers);
        setFieldValue('serialNumber', serialNumbers);
      }
    };

    reader.readAsBinaryString(f);
    e.target.value = '';
  };


  function validate(values) {
    const errors = {};
    if (values['serialNumber']?.length === 0) {
      errors['serialNumber'] = `Please enter serial number`;
    }
    if (values['serialNumber']?.length > serialNumberCount) {
      errors['serialNumber'] = `serial number not more then inventory`;
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="sm"
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullScreen={fullScreen}
      fullWidth
      PaperProps={{
        component: 'form',
        'aria-autocomplete': 'none',
        autoCorrect: 'off'
      }}
    >
      <Formik initialValues={{ serialNumber: [] }} onSubmit={handleSubmit} validateOnMount validate={validate}>
        {({ touched, errors, setFieldValue, values, submitForm }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate className="flex min-h-full flex-col">
            <CustomDialogHeader
              title={'Add Serial Numbers'}
              onClose={handleClose}
              showRequiredLabel={false}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent isFooterPresent={true}>
              <Box pt={1} pb={1}>
                <Typography>{`Inventory without Serial Number - ${serialNumberCount}`}</Typography>
                <Box pt={2} pb={2}>
                  <Divider />
                </Box>
                <Box mb={1} display="flex" justifyContent="flex-end">
                  <Box mr={2}>
                    {qty > 0 &&
                      <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }} onClick={() => handleExport(qty)}>
                        Export
                      </Typography>}
                  </Box>
                  <Box mr={1}>
                    <input
                      accept="json"
                      style={{ display: 'none' }}
                      onChange={handleImport(setFieldValue)}
                      id="import-file"
                      multiple={false}
                      type="file"
                    />
                    <label htmlFor="import-file">
                      <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }}>
                        Import
                      </Typography>
                    </label>
                  </Box>
                </Box>
                <TextField
                  margin="normal"
                  fullWidth
                  size="small"
                  type="number"
                  label="Qty"
                  name="qty"
                  required
                  variant="outlined"
                  value={qty}
                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  onChange={(e) => {
                    setQty(Number(e.target.value.replace(/\D/g, '')))
                  }}
                />
                <Autocomplete
                  size="small"
                  options={[]}
                  freeSolo={true}
                  multiple={true}
                  disableCloseOnSelect
                  value={values['serialNumber']}
                  onChange={(_, val) => {
                    setFieldValue('serialNumber', val);
                  }}
                  isOptionEqualToValue={(item, current) => item === current}
                  getOptionLabel={(option) => option}
                  renderInput={(props) => (
                    <TextField
                      {...props}
                      placeholder={'Enter serial number and press enter'}
                      variant="outlined"
                      name="serialNumber"
                      label={'Serial Number'}
                      error={touched['serialNumber'] && Boolean(errors['serialNumber'])}
                      helperText={touched['serialNumber'] && errors['serialNumber']}
                    />
                  )}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton isLoading={loading} disabled={loading} buttonType="theme" onClick={submitForm}>
                Add
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddSerialNumber;
