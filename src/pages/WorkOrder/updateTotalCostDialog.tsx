import { Fragment, useContext, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import {
    CHILD_RESOURCE,
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
import { isEqual, map, orderBy, uniq } from 'lodash';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';

export default function UpdateTotalCostDialog({ onClose, onSuccess, currency, id }) {
  const toastConfig = useContext(CustomToastContext);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async ()=>{
    let allFields = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderCost, currency, true);

     axiosInstance()
      .get(`${routes.workOrder.path}/total-consumables-cost/${id}`)
      .then(({ data: { data } }) => {
        let initialValue = data;
        initialValue['consumableCost_' + currency.toLowerCase()] = data?.totalConsumablesCost;
        delete initialValue.totalConsumablesCost;
        setInitialData({
            fields: allFields,
            values: getObjKeysWithValues(initialValue, allFields)
          });
          EvaluteproductFields(allFields);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }

  const EvaluteproductFields = (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData);
} 

  const handleSubmit = (values) => {
    setSubmitting(true);
    setSubmitting(false);
  };


  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={'sm'}
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
                title={`Update Cost`}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                {fields &&
                      fields.map((section, i) => (
                        <div key={i}>
                          <div className={'detail-box-content detail-product-box'}>
                            <div className={'product-form-layout'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-product'}`}>{section.name}</h2>
                            </div>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {section.sectionFields &&
                                section.sectionFields.map((field) =>
                                    <FormTypes
                                      fields={initialData.fields}
                                      fieldData={{ ...field, hideConverter: true }}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field.isTooltip}
                                      tooltipMessage={field.tooltipMessage}
                                      size="small"
                                    />
                                )}
                            </Grid>
                          </Box>
                        </div>
                      ))}
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
