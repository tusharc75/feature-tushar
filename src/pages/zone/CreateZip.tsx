import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import {TextField} from "@material-ui/core";
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, isFieldNotTouched } from './../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box } from '@material-ui/core';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';

const CreateZip = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { zoneId, onClose, onSuccess, isUpdateDisabled = false, isClone = false } = props;
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formValues, setFormValues] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [saveClick, setSaveClick] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('')
  const [value , setValue] = useState('')


  
  const handleSubmit = () => {

    let newValues = { zoneZips: [value] };
    setSaveClick(true);
    axiosInstance()
      .post(`/zone/${zoneId}/zip`, newValues)
      .then(({ data: { data } }) => {
        setLoading(false);
        onSuccess(data);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Zone Created Successfully'
        });
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
        setSaveClick(false);
      });
  };



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
        title={
            `Create Zip Code`
        }
        onClose={() => {
         onClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        ></CustomDialogHeader>
      <CustomDialogContent>
        <TextField 
        variant='outlined'
        label='Zip Code'
        name='Zip Code'
        value={value}
        onChange= {(e) => {
          setValue(e.target.value)
         
        }}

        />
      </CustomDialogContent>
         <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                   
                     
                    onClose();
                  }}
                >
                  {isUpdateDisabled ? 'Close' : 'Cancel'}
                </Button>
                {!isUpdateDisabled && (
                  <CustomButton loading={loading} variant="contained" color="primary" type="submit" disabled={saveClick} onClick={handleSubmit}>
                    {' '}
                    Save
                  </CustomButton>
                )}
              </CustomDialogFooter>
              
     
    </Dialog>
  );
};

export default CreateZip;
