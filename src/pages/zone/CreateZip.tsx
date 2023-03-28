import { useState, useContext, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from './../../constants/helpers';
import { Form, Formik } from 'formik';
import { object, string } from 'yup';
import { TextField } from '@material-ui/core';

const CreateZip = (props) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const { zoneId, onClose, onSuccess, isUpdateDisabled = false, isClone = false } = props;
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [saveClick, setSaveClick] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  const zipCodeSchema = object().shape({
    zipCode: string().required('Please enter zip code')
  });

  useEffect(() => {
    setInitialValues({ zipCode: '' });
  }, [zoneId]);

  const handleSubmit = (values) => {
    let newValues = { zoneZips: [values.zipCode] };
    setSaveClick(true);
    axiosInstance()
      .post(`/zone/${zoneId}/zip`, newValues)
      .then(({ data: { data } }) => {
        setLoading(false);
        onSuccess(data);
        setToastConfig({
          open: true,
          type: 'success',
          message: 'Zip Code Created Successfully'
        });
      })
      .catch((error) => {
        setLoading(false);
        setToastConfig(error);
        setSaveClick(false);
      });
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <Dialog
      maxWidth="xs"
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
        title={`Create Zip Code`}
        onClose={() => {
          onClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      {initialValues ? (
        <Formik initialValues={initialValues} validationSchema={zipCodeSchema} onSubmit={handleSubmit} validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <TextField
                    margin="dense"
                    type="text"
                    size="small"
                    label="Zip Code"
                    name="zipCode"
                    variant="outlined"
                    onChange={(e) => {
                      setFieldValue('zipCode', e.target.value);
                    }}
                  />
                </Form>
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
                  <CustomButton loading={loading} variant="contained" color="primary" type="submit" disabled={saveClick} onClick={submitForm}>
                    {' '}
                    Save
                  </CustomButton>
                )}
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : null}
    </Dialog>
  );
};

export default CreateZip;
