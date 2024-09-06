import { useEffect, useState, useContext, Fragment } from 'react';
import { Dialog, Button, CircularProgress, Grid, useTheme, Box } from '@material-ui/core';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useHistory } from 'react-router-dom';
import { getObjKeys, yupSchema, setFieldsInAscendingOrder, getObjKeysWithValues, CustomDialogTransition } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import FormTypes from '../../components/Helpers/FormTypes';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
interface InitialData {
  fields: any[];
  values: object;
}

const ManageEntity = ({ open, close, fetchData, isNew, values = {}, isClone = false, entityId = null, fetchEntities = null }) => {
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: values
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');

  const [formsData, setFormsData] = useState([]);
  const [parentEntityDataSource, setParentEntityDataSource] = useState([]);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    getInitialData();
  }, []);

  useEffect(() => {
    const parentEntityDropdownData = initialData.fields.find((d) => d.fieldName === 'parentEntity' || d.fieldName === 'parent');
    if (parentEntityDropdownData) {
      setParentEntityDataSource(
        isNew ? parentEntityDropdownData.option : parentEntityDropdownData.option.filter((d) => d?.optionValue !== values['_id'])
      );
    }

    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Entity')
      .then(async ({ data: { data } }) => {
        const fieldsData = isNew
          ? data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData)
          : data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        let tempData = getObjKeys('', fieldsData);
        if (isClone) {
          const {
            data: { data }
          } = await axiosInstance().get(`/entity/${entityId}`);
          const { entityName, ...rest } = data;
          setCloneHeading(entityName);
          tempData = getObjKeysWithValues({ ...rest }, fieldsData, true, user);
        }

        setInitialData({
          fields: fieldsData,
          values: isNew ? tempData : getObjKeysWithValues(values, fieldsData)
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (enteredValues) => {
    setSubmitting(true);
    if (isNew) {
      axiosInstance()
        .post('/entity', enteredValues)
        .then(({ data }) => {
          const newId = data.data._id;
          setSubmitting(false);
          fetchData();
          toastConfig.setToastConfig({
            type: 'success',
            open: true,
            message: data.message
          });
          history.push(`/entity/detail/${newId}`);
          close();
        })
        .catch((err) => {
          setSubmitting(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      const { createdBy, updatedBy, ...rest } = enteredValues;
      axiosInstance()
        .put(`/entity`, { _id: values['_id'], ...rest })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          close();
          fetchData();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={isClone ? `Clone - ${cloneHeading}` : isNew ? 'Create New Entities' : 'Update Entity'}
                onClose={() => {
                  if (isEqual(initialData.values, values)) close();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form noValidate>
                  {formsData &&
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
                                {field.fieldName === 'parent' || field.fieldName === 'parentEntity' ? (
                                  <FormTypes
                                    isNew={isNew}
                                    {...field}
                                    fieldData={field}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    fields={initialData.fields}
                                    options={parentEntityDataSource}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                ) : (
                                  <FormTypes
                                    isNew={isNew}
                                    fieldData={field}
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
                                    fields={initialData.fields}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    imageOrFileUploadCompletePercentage={
                                      ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                        ? (completePercentage) => {
                                            setUploadingImageOrFileProgress(completePercentage);
                                          }
                                        : null
                                    }
                                  />
                                )}
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
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) close();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={submitForm}
                  disabled={isSubmitting || loading || uploadingImageOrFileProgress > 0}
                >
                  {isSubmitting ? <CircularProgress size={22} /> : 'Submit'}
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    close();
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

export default ManageEntity;
