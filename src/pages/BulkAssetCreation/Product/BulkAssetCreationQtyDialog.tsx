import { FC, useEffect, useState, Fragment } from 'react';
import { Button, Dialog, Box } from '@mui/material';
import { arrayToDropwdownOption, CHILD_RESOURCE } from '../../../constants/helpers';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';

interface BulkAssetCreationQtyDialogProps {
  onClose: VoidFunction | any;
  currency: string;
  onSubmit: VoidFunction | any;
  productData?: object | any;
  bulkAssetCreationData?: object | any;
  bulkEdit?: boolean | any;
}

const BulkAssetCreationQtyDialog: FC<BulkAssetCreationQtyDialogProps> = ({
  onClose,
  currency,
  onSubmit,
  productData,
  bulkEdit,
  bulkAssetCreationData
}) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchField();
  }, []);

  const fetchField = async () => {
    var fields = await fetch_child_resource_fields(CHILD_RESOURCE.bulkAssetCreationProduct, bulkAssetCreationData?.currency, true);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    if (bulkEdit) {
      let unitArray: any = [];
      productData?.forEach((element) => {
        if (element?.productDetail?.unit) {
          unitArray.push([...element?.productDetail?.unit]);
        }
      });
      let unit: any = unitArray?.shift()?.filter(function (v) {
        return unitArray.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      const unitOptions: any = arrayToDropwdownOption(unit);
      fields.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      fields = fields.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: fields,
        values: { ...getObjKeys('', fields), expectedDelivery: '' }
      });
    } else {
      fields.filter((_f) => {
        if (['unit'].includes(_f.fieldName.toLowerCase())) {
          if (productData?.productDetail?.unit) {
            _f.option = arrayToDropwdownOption(productData?.productDetail?.unit);
          }
        }
      });
      let tempObjKeysWithValues = getObjKeysWithValues(productData, fields);
      if (!tempObjKeysWithValues['taxSchedule'] && bulkAssetCreationData['taxSchedule']) {
        tempObjKeysWithValues['taxSchedule'] = bulkAssetCreationData['taxSchedule'];
      }
      if (!tempObjKeysWithValues['expectedDelivery'] && bulkAssetCreationData['deliveryDate']) {
        tempObjKeysWithValues['expectedDelivery'] = bulkAssetCreationData['deliveryDate'];
      }
      setInitialData({
        fields: fields,
        values: tempObjKeysWithValues
      });
    }
  };

  const handleSubmit = (values) => {
    let returnData = [];
    if (bulkEdit) {
      for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x];
        }
      }
      productData.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        returnData.push({ _id: element._id, productId: element.productId, ...calValues });
      });
    } else {
      returnData = [{ ...values, _id: productData._id, productId: productData.productId }];
    }
    onSubmit(returnData);
  };

  function validate(values) {
    const errors = {};
    if (values?.qty < values?.actualReceived) {
      errors['qty'] = 'Quantity should be greater than Actual Received';
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
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={bulkEdit ? 'Bulk Edit' : `Edit ${productData?.productName || ''}`}
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
                    onClose();
                  }}
                >
                  {'Close'}
                </Button>
                <CustomButton variant="contained" color="primary" type="submit" onClick={submitForm}>
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
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

export default BulkAssetCreationQtyDialog;
