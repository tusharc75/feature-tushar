import { FC, useEffect, useState, Fragment, useRef } from 'react';
import { Dialog, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import FieldList from 'src/components/FormBuilder/FieldList';

interface EditDialogProps {
  onClose: VoidFunction | any;
  rowData: object | any;
  handleSave: any;
  loading: boolean
}

const ProductQtyDialog: FC<EditDialogProps> = ({ onClose, rowData, handleSave, loading }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const newFields = field.map((item) => item.fieldData);
    setInitialData({
      fields: newFields,
      values: getObjKeysWithValues(rowData, newFields)
    });
  };

  const handleSubmit = async (values) => {
    handleSave({ ...values, _id: rowData?._id, product: rowData?.materialId });
  };

  const validate = (values) => {
    const errors = {};
    return errors;
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
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={`Edit - ${rowData?.detail}`}
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
                <ThemeButton
                  isLoading={loading}
                  disabled={loading || isEqual(ref?.current?.values, initialData.values)}
                  buttonType="theme"
                  onClick={submitForm}
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

const field = [
  {
    fieldData: {
      fieldLabel: 'Qty',
      fieldName: 'qty',
      isTooltip: false,
      option: [],
      order: 1,
      required: true,
      sectionName: 'Quantity Information',
      tooltipMessage: '',
      type: FieldList.DECIMAL.type
    },
    isCreate: true,
    isDelete: true,
    isUpdate: true
  }
];

export default ProductQtyDialog;
