import { FC, useEffect, useState } from 'react';
import { Button, Dialog, TextField, Grid, Box, CircularProgress, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateUtils from '@date-io/date-fns';


import { dateFormatForInputControl } from '../../constants/helpers';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';

interface EditDialogProps {
  onClose: VoidFunction | any;
  isSaving: boolean;
  submitBulkEdit: VoidFunction | any;
  currencySymbol: string;
  data?: object | any
}

const BulkEditInventoryDialog: FC<EditDialogProps> = ({ onClose, isSaving, submitBulkEdit, currencySymbol, data }) => {
  const [values, setValues] = useState(null)
  const [isDisabled, setDisabled] = useState(false);

  useEffect(() => {
    if (data) {

      if (data.hasOwnProperty("packageId")) {
        setDisabled(true)
      }

      const newValues = {
        ...data,
        qty: data?.qty || 0,
        pricingMethod: data?.pricingMethod || '',
        startDate: data?.startDate || new Date(),
        endDate: data?.endDate || new Date(),
        UOM: data?.UOM || "",
        price: data?.price || 0,
        discount: data?.discount || 0,
        finalPrice: data?.finalPrice || 0
      }
      setValues(newValues)
    }

  }, [data])

  const handleChange = (name: string, value: any) => {
    setValues((prevState) => {
      const newState = { ...prevState, [name]: value };
      return newState
    });
  };

  const handleClose = () => {
    if (isSaving === false) {
      onClose()
    }
  }


  return (
    <Dialog open fullWidth maxWidth="md" onClose={handleClose}>
      <CustomDialogHeader title={data ? "Edit" : 'Bulk Edit'} onClose={handleClose} />
      <CustomDialogContent>
        <MuiPickersUtilsProvider utils={DateUtils}>
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  disabled={isDisabled}
                  label="Qty"
                  name="qty"
                  fullWidth
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.qty || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl disabled={isDisabled} size="small" variant="outlined" fullWidth>
                  <InputLabel id="pricing-method-label">
                    Pricing Method
                  </InputLabel>
                  <Select
                    name="pricingMethod"
                    labelId="pricing-method-label"
                    label="Pricing Method"
                    value={values?.pricingMethod || ""}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                  >
                    <MenuItem value="Per Day">Per Day</MenuItem>
                    <MenuItem value="Per Week">Per Week</MenuItem>
                    <MenuItem value="Per Month">Per Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  disabled={isDisabled}
                  maxDate={values?.endDate || new Date()}
                  label="Start Date"
                  name="startDate"
                  fullWidth
                  size="small"
                  inputVariant="outlined"
                  variant='inline'
                  format={dateFormatForInputControl}
                  clearable
                  autoOk
                  value={values?.startDate || new Date()}
                  onChange={(date) => handleChange("startDate", date)}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  disabled={isDisabled}
                  label="End Date"
                  name="endDate"
                  fullWidth
                  size="small"
                  inputVariant="outlined"
                  variant='inline'
                  format={dateFormatForInputControl}
                  clearable
                  autoOk
                  value={values?.endDate || new Date()}
                  minDate={values?.startDate || new Date()}
                  onChange={(date) => handleChange("endDate", date)}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl disabled={isDisabled} size="small" variant="outlined" fullWidth>
                  <InputLabel id="UOM-label">
                    UOM
                  </InputLabel>
                  <Select
                    name="UOM"
                    labelId="UOM-label"
                    label="UOM"
                    value={values?.UOM || ""}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                  >
                    <MenuItem value="Litre">Litre</MenuItem>
                    <MenuItem value="Gram">Gram</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  name="price"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {currencySymbol ? currencySymbol : ""}
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.price || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Discount (%)"
                  name="discount"
                  fullWidth
                  InputProps={{
                    endAdornment: '%',
                    inputProps: { min: 0 },
                  }}
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.discount || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  disabled={isDisabled}
                  label="Final Price"
                  name="finalPrice"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {currencySymbol ? currencySymbol : ""}
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.finalPrice || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>
        </MuiPickersUtilsProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" disabled={isSaving} size="small" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={isSaving || !Boolean(values)}
          size="small"
          onClick={() => submitBulkEdit(values)}
          endIcon={isSaving && <CircularProgress size={20} />}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default BulkEditInventoryDialog;
