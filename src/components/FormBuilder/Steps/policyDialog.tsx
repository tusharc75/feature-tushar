import { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormControlLabel,
  Checkbox
} from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { FieldArray, Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { resourcePolicy } from './helper';

const PolicyDialog = ({ resourceData, resource, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({ data: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let currentPolicy = resourceData?.policy || {};
    let defaultPolicy = resourcePolicy.find((e) => e.resource === resource);
    setInitialValues({
      data: defaultPolicy.policy.map((e) => {
        return {
          fieldName: e.fieldName,
          fieldLabel: e.fieldLabel,
          type: e.type,
          checked: currentPolicy[e.fieldName] || false
        };
      })
    });
  }, []);

  const updateData = (values) => {
    setIsSubmitting(true);
    let updatedPolicy = (values.data).reduce((acc, { fieldName, checked }) => {
      return { ...acc, [fieldName]: checked }
    }, {});
    let data = {
      policy: { ...updatedPolicy },
    };
    axiosInstance()
      .put(`/sa-formbuilder/steps/policy/${resource}`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog
      maxWidth="xs"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      {initialValues?.data?.length ? (
        <Formik initialValues={initialValues} onSubmit={updateData}>
          {({ values, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={onClose}
                title={'Policy'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
              />
              <CustomDialogContent>
                <Form>
                  <div className="flex flex-col gap-1">
                    <FieldArray
                      name="data"
                      render={(arrayHelpers) =>
                        values.data?.map((data, index) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                name={data?.fieldName}
                                checked={data?.checked}
                                onChange={(e, val) => {
                                  arrayHelpers.replace(index, {
                                    ...values?.data[index],
                                    ['checked']: val
                                  });
                                  const res = initialValues.data;
                                  res.forEach((r) => {
                                    if (r.fieldName === data.fieldName) {
                                      r.checked = val;
                                    }
                                  });
                                  setInitialValues({ data: res });
                                }}
                              />
                            }
                            label={data?.fieldLabel}
                          />
                        ))
                      }
                    />
                  </div>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" color="primary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
                >
                  Save
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default PolicyDialog;
