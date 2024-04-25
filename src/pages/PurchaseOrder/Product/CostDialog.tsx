import { useEffect, useState, Fragment } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import { uniq, map, orderBy, isEqual } from 'lodash';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { fetchTaxRate } from './helper';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { bulkUpdate } from 'src/components/RentalManagment/helper';

const CostDialog = ({ onClose, purchaseOrderData, handleAddCost, handleUpdateCost, costData, bulkEdit, showSaveAndNext, loadingEdit }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [costData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    let data = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderCost, purchaseOrderData?.currency, true);
    setAllFields(JSON.parse(JSON.stringify(data)));
    if (bulkEdit) {
      data.forEach((element) => {
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: { ...getObjKeys('', data) }
      });
    } else {
      if (costData) {
        setInitialData({
          fields: data,
          values: getObjKeysWithValues(costData, data)
        });
      } else {
        setInitialData({
          fields: data,
          values: getObjKeys('', data)
        });
      }
    }
    EvaluteproductFields(data);
  };

  const EvaluteproductFields = async (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });

    if (purchaseOrderData?.taxCode) {
      const taxCodeOptions = await fetchTaxRate(purchaseOrderData?.taxCode?.optionValue);
      fields?.forEach((e: any) => {
        if (e?.fieldName === 'taxCode') {
          e.option = taxCodeOptions;
        }
      });
    }

    setFields(customData);
  };

  const handleSubmit = (values) => {
    let returnData = [];
    if (bulkEdit) {
      returnData = bulkUpdate(values, costData, [], allFields, purchaseOrderData?.currency);
      handleUpdateCost(returnData);
    } else {
      if (!costData) {
        returnData = [{ ...values }];
        handleAddCost(returnData);
      } else {
        returnData = [{ ...values, _id: costData._id }];
        handleUpdateCost(returnData, saveAndNext);
      }
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
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  bulkEdit ? 'Bulk Edit' : costData ? `Edit - ${costData?.index} (${costData?.description || 'Manual Entry'})` : `Add Manual Entry`
                }
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
                                field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter ? (
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
                                ) : (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <Box display="flex">
                                      <Box flexGrow={1}>
                                        <FormTypes
                                          {...field}
                                          fields={initialData.fields}
                                          fieldData={field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                            if (name === 'taxCode') {
                                              const taxCode = field.option?.find((d) => d.optionValue === value);
                                              setFieldValue('taxPercentage', taxCode?.taxRate || 0);
                                              const result = autoCalculateSpecificFields(
                                                { ['taxPercentage']: taxCode?.taxRate || 0 },
                                                values,
                                                initialData.fields
                                              );
                                              if (Object.keys(result).length >= 1) {
                                                for (var x in result) {
                                                  setFieldValue(x, result[x]);
                                                }
                                              }
                                            }
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field.isTooltip}
                                          tooltipMessage={field.tooltipMessage}
                                          size="small"
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                )
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
                  onClick={() => {
                    onClose();
                  }}
                >
                  {'Close'}
                </Button>
                {bulkEdit === false && showSaveAndNext && (
                  <CustomButton
                    loading={loadingEdit}
                    disabled={loadingEdit}
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
                  disabled={loadingEdit}
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

export default CostDialog;
