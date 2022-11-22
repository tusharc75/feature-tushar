import { Fragment, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  generateUniqueIdOnly,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
  purchaseOrder,
  PURCHASE_ORDER_STATUS,
  setFieldsInAscendingOrder,
  supplierAccount,
  supplierContact,
  yupSchema
} from '../../constants/helpers';
import { Form, Formik } from 'formik';
import { Box, Button, Grid, TextField } from '@material-ui/core';
import { dateFormat } from '../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';

const AddInvoice = ({ purchaseOrderId, handleClose }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [date, setDate] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(null)
  const [loading, setLoading] = useState(false);

  const handleSubmit = async() => {
    let response = await axiosInstance().post(`${purchaseOrder.api}/invoice/${purchaseOrderId}/`)
    let data = response.data
    handleClose()
  }
  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      <CustomDialogHeader
        title={'Add Invoice'}
        onClose={() => {
          handleClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <CustomDialogContent>
        <MuiPickersUtilsProvider utils={MomentUtils}>
          <Box>
            <div className={'detail-box-content'}>
              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{'Add Invoice'}</h2>
            </div>
            <Box marginY={2} />
            <Grid spacing={3} container>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  name={`Invoice Number`}
                  label="Invoice Number"
                  variant="outlined"
                  margin="dense"
                onChange={(val:any)=>setInvoiceNumber(val)}                   
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <KeyboardDatePicker
                  autoOk
                  size="small"
                  disablePast
                  variant="inline"
                  inputVariant="outlined"
                  value={date}
                  name="startDate"
                  label="Start Date"
                  onChange={(date: any) => {
                    setDate(date);
                    // setFieldValue("startDate", date ? date : null);
                    // setFieldValue("startTime", date ? getTime(date._d) : null);
                  }}
                  format={dateFormat}
                  InputLabelProps={{
                    shrink: true
                  }}
                  margin="dense"
                />
              </Grid>
            </Grid>
          </Box>
        </MuiPickersUtilsProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          size="small"
          color="primary"
          onClick={() => {
            handleClose()
          }}
        >
          Cancel
        </Button>
        <CustomButton
          loading={loading}
          variant="contained"
          color="primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit()
          }}
          disabled={
            loading
            || !date || !invoiceNumber
            // isFieldNotTouched(initialData, values)
          }
        >
          {' '}
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AddInvoice;
