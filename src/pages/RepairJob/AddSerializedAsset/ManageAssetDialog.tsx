import { useContext, useState, useEffect, Fragment, useRef } from 'react';
import { Box, Button, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, getObjKeysWithValues, repairJob, yupSchema, REPAIR_JOB_STATUS } from '../../../constants/helpers';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import FormTypes from '../../../components/Helpers/FormTypes';
import { uniq, map, orderBy } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import CustomButton from 'src/components/Helpers/CustomButton';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';

export default function ManageAssetDialog({
  allFields,
  onClose,
  repairJobData,
  handleSaveData,
  loadingEdit,
  selectedRecords,
  showSaveAndNext,
  isBulkedit,
  data
}) {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
      isStepDataSet.current = true;
      const ignoreField = ['currency', 'owner', 'pdfTemplate'];
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields, ignoreField)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

  useEffect(() => {
    if (isBulkedit) {
      allFields?.forEach((e) => {
        e.required = false;
      });
      setInitialData({
        fields: allFields,
        values: getObjKeysWithValues({ expectedCompletionDate: '' }, allFields)
      });
    } else {
      axiosInstance()
        .get(`${repairJob.api}/${repairJobData?._id}/assets/${data?.inventory}`)
        .then(({ data: { data } }) => {
          setInitialData({
            fields: allFields,
            values: getObjKeysWithValues(data, allFields)
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
    const sections = uniq(map(allFields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = allFields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setCustomFields(customData);
  }, [data]);

  const handleSubmit = (values) => {
    const returnData = [];
    if (isBulkedit) {
      for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x];
        }
      }
      selectedRecords.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        returnData.push({ _id: element.inventory, ...calValues });
      });
    } else {
      returnData.push({
        ...values,
        _id: data?.inventory
      });
    }
    isBulkedit ? handleSaveData(returnData) : handleSaveData(returnData, saveAndNext);
  };

  return (
    <Fragment>
      <Dialog
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={true}
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
                  title={isBulkedit ? 'Bulk Edit' : `Edit - ${data?.index} (${data?.assetNumber || ''})`}
                  onClose={() => {
                    onClose();
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {customFields &&
                      customFields.map((section, i) => (
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
                                  ) : ['expectedCompletionDate'].includes(field.fieldName) ? (
                                    <Grid key={field.fieldName} size={{xs:12, sm:6, md:6}}>
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
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
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            minDate={repairJobData['startDate'] ? new Date(repairJobData['startDate']) : undefined}
                                          />
                                        </Box>
                                      </Box>
                                    </Grid>
                                  ) : (
                                    <Grid key={field.fieldName} size={{xs:12, sm:6, md:6}}>
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            disabled={repairJobData['status'] === REPAIR_JOB_STATUS.completed ? true : field.disableOnEdit}
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
                  <Button size="small" variant="outlined" color="primary" onClick={onClose}>
                    Close
                  </Button>
                  {isBulkedit === false && showSaveAndNext && (
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
                    id={'dialog-save-button'}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(allFields.length).keys()]} />
          </Box>
        )}
      </Dialog>
      {showConfirmDialog && (
        <ConfirmCancelDialog
          open={showConfirmDialog}
          onSave={() => {
            setShowConfirmDialog(false);
          }}
          onClose={() => {
            setShowConfirmDialog(false);
            onClose();
          }}
        />
      )}
    </Fragment>
  );
}
