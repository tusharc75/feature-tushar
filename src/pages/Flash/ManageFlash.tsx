import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, setFieldsInAscendingOrder, flash, GenerateResourceLineNumber } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';

const ManageFlash = ({ isClone = false, flashId = null, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
 
  const ref = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [flashData, setFlashData] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  
  const fieldConfigurations = {
    Bankrupt: [
      'date',
      'caseNumber',
      'chapter'
    ],
    'Credit card refused': [
      'deniedBecause'
    ],
    'Final demand': [
      'date',
      'amount',
      'disputed'
    ],
    NSF: [
      'date',
      'amount',
      'returned'
    ],
    'Past due': [
      'daysPastDue',
      'amount',
      'holdingOrders'
    ],
    'Placed for Collections': [
      'date',
      'amount',
      'disputed'
    ],
    'Terms Withdrawn': [
      'termsWithdrawn'
    ],
    Comment : [
      'comment'
    ]
  };


  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${flash.resource}`)
      .then(({ data: { data } }) => {

        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (flashId) {
          axiosInstance()
            .get(`${flash.api}/` + flashId)
            .then(({ data: { data } }) => {
              setFlashData(data);
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          createValues['flashNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
          setInitialData({
            fields: fieldsDataForCreate,
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [flashId]);

  useEffect(() => {
    const filteredFields = initialData.fields.filter((d) => {
      if (d?.sectionName === "Other Information") {
        return d?.fieldName === 'comment';
      }
      return true;
    });
    setFormsData(setFieldsInAscendingOrder(filteredFields));
  }, [initialData.fields]);

  const handleTypeChange = (data) => {
    const selectedFieldNames = new Set(fieldConfigurations[data] || []);
    selectedFieldNames.add('comment');
  
    const filteredFields = initialData.fields.filter((d) => {
      if (d?.sectionName === "Other Information") {
        return selectedFieldNames.has(d.fieldName);
      }
      return true;
    });
  
    setFormsData(setFieldsInAscendingOrder(filteredFields));
  }; 

  const handleSubmit = (values) => {
    setLoading(true);
    if (flashId && isClone === false) {
      values._id = flashId;
      axiosInstance()
        .put(`${flash.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
  
      axiosInstance()
        .post(`${flash.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          history.push(`${routes.flash.path}/detail/${data?.data?._id}`);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const getCurrentDisplayedFields = [
      ...formsData?.map((d) =>
        d?.sectionFields?.map((m) => m?.fieldName)
      )
    ].flat();
    
    const err = Object.keys(errors).filter((key) =>
      getCurrentDisplayedFields.includes(key)
    );
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  const fixErrors = (errors) => {
    const getCurrentDisplayedFields = [
      ...formsData?.map((d) =>
        d?.sectionFields?.map((m) => m?.fieldName)
      )
    ].flat();
  
    const err = Object.keys(errors).filter((key) =>
      getCurrentDisplayedFields.includes(key)
    );
  
    // Create a new object with only the keys present in err
    const filteredErrors = {};
    err?.forEach((key) => {
      filteredErrors[key] = errors[key];
    });    
    // Now, filteredErrors contains only the keys present in err
    return filteredErrors;
  };

  const transFormData = (formsData)=>{
    return [
      ...formsData?.map((d) =>
        d?.sectionFields?.map((m) => m)
      )
    ].flat();
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {formsData && formsData.length ? (
        <Formik
          innerRef={ref}
          initialValues={initialData.values}
          validationSchema={yupSchema(transFormData(formsData))}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, submitForm, setFieldValue }) => (
            <Fragment>
              <CustomDialogHeader
                title={flashId ? (isClone ? 'Clone' : `Update ${flashData?.flashNumber}`) : 'Create ' + routes.flash.title}
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
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
                  {formsData.length > 0 &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                <FormTypes
                                  isNew={Boolean(flashId)}
                                  {...field}
                                  fieldData={field}
                                  disabled={Boolean(flashId) && field.disableOnEdit && !isClone}
                                  values={values}
                                  errors={fixErrors(errors)}
                                  touched={touched}
                                  label={field.fieldLabel}
                                  name={field.fieldName}
                                  type={field.type}
                                  options={field.option}
                                  setFieldValue={(name, value) => {
                                    setFieldValue(name, value);
                                    if (field.fieldName === 'flashType') {
                                      handleTypeChange(value);
                                    }
                                  }}
                                  required={field.required}
                                  fullWidth
                                  isTooltip={field?.isTooltip || false}
                                  tooltipMessage={field?.tooltipMessage}
                                  size="small"
                                />
                              </Grid>
                            ))}
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
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={loading}
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
                    handleScroll(errors);
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

export default ManageFlash;
