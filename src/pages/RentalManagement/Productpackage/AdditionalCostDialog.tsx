import { FC, useContext, useEffect, useState, Fragment, useRef } from 'react';
import { Button, Dialog, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { isEqual } from 'lodash';
import { fetch_rental_cost_fields } from '../../../components/RentalManagment/helper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import moment from 'moment';
import InputField from 'src/components/Helpers/InputField';

interface AdditionalCostDialogProps {
  onClose: VoidFunction | any;
  currency: string;
  handleAddCost: VoidFunction | any;
  handleUpdateCost: VoidFunction | any;
  costData?: object | any;
  loadingEdit?: Boolean;
  showSaveAndNext?: Boolean;
}

const AdditionalCostDialog: FC<AdditionalCostDialogProps> = ({
  onClose,
  currency,
  handleAddCost,
  handleUpdateCost,
  costData,
  loadingEdit,
  showSaveAndNext
}) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, [costData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    const poFields = await fetch_rental_cost_fields(currency, isOffline);
    if (costData) {
      setInitialData({
        fields: poFields,
        values: getObjKeysWithValues(costData, poFields)
      });
    } else {
      setInitialData({
        fields: poFields,
        values: getObjKeys('', poFields)
      });
    }
  };

  const handleSubmit = (values) => {
    if (!costData) {
      let returnData = [];
      returnData = [{ ...values }];
      handleAddCost(returnData);
    } else {
      let returnData = [];
      returnData = [{ ...values, _id: costData._id }];
      handleUpdateCost(returnData, saveAndNext);
    }
  };

  function validate(values) {
    const errors = {};
    let actualStartDate = moment(values?.actualStartDate);
    let actualEndDate = moment(values?.actualEndDate);
    if (actualEndDate.diff(actualStartDate, 'days') < 0) {
      errors['actualEndDate'] = 'Please enter valid actual end date';
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik
          innerRef={ref}
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields?.filter((f) => f?.isRead))}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={costData ? 'Edit' : 'Add'}
                onClose={() => {
                  if (!isEqual(ref?.current?.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  {'Close'}
                </Button>
                {showSaveAndNext && (
                  <CustomButton
                    loading={loadingEdit}
                    disabled={isEqual(ref?.current?.values, initialData.values) || loadingEdit}
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                  >
                    {' '}
                    Save & Next
                  </CustomButton>
                )}
                <CustomButton
                  loading={loadingEdit}
                  disabled={isEqual(ref?.current?.values, initialData.values)}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Fragment>
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

export default AdditionalCostDialog;
