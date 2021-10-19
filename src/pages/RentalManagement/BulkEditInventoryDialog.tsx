import { useState } from 'react';
import { Button, Dialog, TextField, Grid, Box, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateUtils from '@date-io/date-fns';


import { dateFormatForInputControl } from '../../constants/helpers';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';

const BulkEditInventoryDialog = ({ onClose, isSaving, submitBulkEdit }) => {
  const [values, setValues] = useState(null)

  const handleChange = (name: string, value: any) => {
    setValues((prevState) => {
      const newState = { ...prevState, [name]: value };
      console.log(newState)
      return newState
    });

  };

  const handleClose = () => !isSaving && onClose


  return (
    <Dialog open fullWidth maxWidth="md" onClose={handleClose}>
      <CustomDialogHeader title={'Bulk Edit'} onClose={handleClose} />
      <CustomDialogContent>
        <MuiPickersUtilsProvider utils={DateUtils}>
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
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
                <TextField
                  label="Final Price"
                  name="finalPrice"
                  fullWidth
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.finalPrice || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" variant="outlined" fullWidth>
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
                <TextField
                  label="Price"
                  name="price"
                  fullWidth
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
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.discount || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" variant="outlined" fullWidth>
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
                <KeyboardDatePicker
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
