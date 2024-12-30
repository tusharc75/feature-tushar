import { FC, useEffect, useState, Fragment, useRef } from 'react';
import { Dialog, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  const [allFields, setAllFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);
  const [saveAndNext, setSaveAndNext] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [costData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    const poFields = await fetch_child_resource_fields(CHILD_RESOURCE.salesOrderCost, currency, true);
    setAllFields(JSON.parse(JSON.stringify(poFields)));
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
      returnData = [{ ...getObjKeysWithValues(values, allFields) }];
      handleAddCost(returnData);
    } else {
      let returnData = [];
      returnData = [{ ...getObjKeysWithValues(values, allFields), _id: costData._id }];
      handleUpdateCost(returnData, saveAndNext);
    }
  };

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
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
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
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  {'Close'}
                </ThemeButton>
                {showSaveAndNext && (
                  <ThemeButton
                    isLoading={Boolean(loadingEdit)}
                    disabled={Boolean(isEqual(ref?.current?.values, initialData.values)) || Boolean(loadingEdit)}
                    buttonType="theme"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                  >
                    {' '}
                    Save & Next
                  </ThemeButton>
                )}
                <ThemeButton
                  isLoading={Boolean(loadingEdit)}
                  disabled={Boolean(isEqual(ref?.current?.values, initialData.values))}
                  buttonType="theme"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
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
