import { Fragment, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { CustomDialogTransition, getObjKeysWithValues, sidebarResource, yupSchema } from '../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export default function StatusChangeFieldDialog({ onClose, onSuccess, statusPolicy, fields, serializedAssetData, productInventoryId }) {
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [decimalFields, setDecimalFields] = useState([]);

  useEffect(() => {
    let fieldsData = fields.filter((d) => statusPolicy?.fields.includes(d.fieldData.fieldName));
    let fieldsDataForUpdate = fieldsData.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
    let initialValues = getObjKeysWithValues(serializedAssetData, fieldsDataForUpdate);
    const decimalField = [];

    if (statusPolicy?.sumDecimalField || statusPolicy?.autoIncrementDecimalField) {
      fieldsDataForUpdate?.forEach((e) => {
        if (e?.type === 'decimal' && statusPolicy?.sumDecimalField) {
          decimalField.push(e.fieldName);
          initialValues[`${e.fieldName}_orignal`] = initialValues[e.fieldName];
          initialValues[e.fieldName] = 0;
        } else if (e?.type === 'decimal' && statusPolicy?.autoIncrementDecimalField) {
          e.isWarningTooltip = true;
          e.warningTooltipMessage = `Auto Increment (Previous Value ${initialValues[e.fieldName] || 0})`;
          initialValues[e.fieldName] = (initialValues[e.fieldName] || 0) + 1;
        }
      });
    }
    setDecimalFields(decimalField);
    setInitialData({
      fields: fieldsDataForUpdate,
      values: initialValues
    });
  }, []);

  const handleSubmit = (values) => {
    setSubmitting(true);
    const data: any = {};
    statusPolicy?.fields?.forEach((fieldName) => {
      if (statusPolicy?.sumDecimalField && decimalFields?.includes(fieldName)) {
        data[fieldName] = parseFloat(values[fieldName] || 0) + parseFloat(values[`${fieldName}_orignal`] || 0);
      } else {
        data[fieldName] = values[fieldName];
      }
    });
    onSuccess(data);
    setSubmitting(false);
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} enableReinitialize={true} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${serializedAssetData?.assetNumber}`}
              />
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
                    resource={sidebarResource.serializedAsset}
                    referenceId={productInventoryId || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>

                <ThemeButton
                  buttonType='transparent'
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  buttonType='theme'
                  disabled={submitting}
                  onClick={submitForm}
                  isLoading={submitting}
                >
                  Save
                </ThemeButton>

              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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
}
