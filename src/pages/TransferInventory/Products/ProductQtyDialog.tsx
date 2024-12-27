import { FC, useEffect, useState, Fragment, useRef } from 'react';
import { Button, Dialog, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

interface EditDialogProps {
  onClose: VoidFunction | any;
  transferInventoryData: any;
  rowData?: object | any;
  handleSave: any;
}

const ProductQtyDialog: FC<EditDialogProps> = ({ onClose, rowData, handleSave }) => {
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
    let rows: any = { ...rowData, ...values };
    handleSave({ data: rows });
  };

  const validate = (values) => {
    const errors = {};
    if (values?.qty > rowData?.inventory) {
      errors['qty'] = "Qty can't be greater then inventory";
    }
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
                title={`Edit - ${rowData?.productName}`}
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
                <CustomButton
                  disabled={isEqual(ref?.current?.values, initialData.values)}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={submitForm}
                >
                  {' '}
                  Save
                </CustomButton>
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
      type: 'number'
    },
    isCreate: true,
    isDelete: true,
    isUpdate: true
  }
];

export default ProductQtyDialog;
