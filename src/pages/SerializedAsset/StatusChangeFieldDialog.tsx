import { Fragment, useContext, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import {
  CustomDialogTransition,
  getObjKeysWithValues,
  yupSchema,
} from '../../constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CircularProgress } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';

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
    if (statusPolicy?.sumDecimalField) {
      fieldsDataForUpdate?.forEach((e) => {
        if (e?.type === 'decimal') {
          decimalField.push(e.fieldName)
          initialValues[`${e.fieldName}_orignal`] = initialValues[e.fieldName];
          initialValues[e.fieldName] = 0;
        }
      })
    }
    setDecimalFields(decimalField)
    setInitialData({
      fields: fieldsDataForUpdate,
      values: initialValues
    });
  }, []);

  const handleSubmit = (values) => {
    setSubmitting(true);
    const data: any = {}
    statusPolicy?.fields?.forEach((fieldName) => {
      if (statusPolicy?.sumDecimalField && decimalFields?.includes(fieldName)) {
        data[fieldName] = parseFloat(values[fieldName] || 0) + parseFloat(values[`${fieldName}_orignal`] || 0)
      }
      else {
        data[fieldName] = values[fieldName]
      }
    })
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
        <Formik
          initialValues={initialData.values}
          enableReinitialize={true}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
        >
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
                  <Box marginY={2}>
                    <Grid spacing={3} container>
                      {initialData?.fields.map((field) => (
                        <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                          <FormTypes
                            {...field}
                            fieldData={field}
                            values={values}
                            errors={errors}
                            touched={touched}
                            disabled={field?.disableOnEdit || field?.isUneditable}
                            label={field.fieldLabel}
                            name={field.fieldName}
                            type={field.type}
                            options={field.option}
                            setFieldValue={(name, value) => {
                              setFieldValue(name, value);
                            }}
                            required={field.required}
                            fullWidth
                            isTooltip={field?.isTooltip || false}
                            tooltipMessage={field?.tooltipMessage}
                            size="small"
                            fields={initialData?.fields}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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
}
