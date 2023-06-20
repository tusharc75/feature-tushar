import { useContext, useEffect, useState } from 'react';
import { getObjKeys, initializeDropdownById, sidebarResource, getObjKeysWithValues, setFieldsInAscendingOrder, CustomDialogTransition, yupSchema } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Box, Button, Dialog, Grid, IconButton, Tooltip } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import FormTypes from '../../../components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import InfoIcon from '@material-ui/icons/Info';
import AddIcon from '@material-ui/icons/AddCircle';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';


export default function ManageContactDialog(props) {
  const {
    onClose,
    onSuccess,
    accountId,
    contactResource,
    contactApi,
    account = {},
    userId = null,
    isRedirectToDetailPage = true,
    contactId = null,
    handleSubmit = null,
    isClone = false,
    isGetContactData = false,
    onGetAddedContact = null,
  } = props;
  const { accountResource } = account;
  const {
    state: { user, permissions }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [contactData, setContactData] = useState<any>({
    fields: [],
    initialValues: {}
  });
  const [loading, setLoading] = useState(false);
  const [additionalFieldName, setAdditionalFieldName] = useState('');
  const [reportsToMainDataSource, setReportsToMainDataSource] = useState([]);
  const [formsData, setFormsData] = useState([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [reportsToDataSource, setReportsToDataSource] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const history = useHistory();
  const isNew = isClone ? true : contactId ? false : true;

  useEffect(() => {
    const { contactData } = props;
    if (contactData && contactData?.fields.length !== 0 && contactData?.initialValues.length !== 0) {
      setContactData({
        fields: contactData.fields,
        initialValues: contactData.initialValues
      });
    } else getContactFields();
  }, []);

  useEffect(() => {
    if (contactData.fields.length > 0) {
      if (isNew) {
        const processSteps = contactData.fields.find((d) => d.type.toLowerCase() === 'process');
        if (processSteps) {
          contactData.fields.map((d) => {
            if (d.sectionName == processSteps?.additionalInfoSection) {
              setAdditionalFieldName(d.sectionName);
            }
          });
        }
      }
      const reportsToDropdownData = contactData.fields.find((d) => d.fieldName === 'reportsTo');
      if (reportsToDropdownData) {
        if (isNew) {
          setReportsToMainDataSource(reportsToDropdownData.option);
        } else {
          let currentContactRemovedDataSource = reportsToDropdownData.option.filter((d) => d?.optionValue !== contactId);
          setReportsToMainDataSource(currentContactRemovedDataSource);
        }
      }
      setFormsData(setFieldsInAscendingOrder(contactData.fields));
    }
  }, [contactData.fields]);

  const getContactFields = () => {
    setLoading(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource[contactResource]}`)
      .then(({ data: { data } }) => {
        const newFields = [];
        data
          .filter((d) => d.isCreate)
          .map((_f) => {
            //  If this dialog opens from account details screen, make that account preselected
            if (accountId && _f.fieldData.fieldName === 'accountName') {
              _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
            }

            if (userId && _f.fieldData.fieldName == 'owner') {
              _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
            }
            newFields.push(_f.fieldData);
          });
        if (isClone && contactId) {
          getContactCloneData(newFields);
        } else {
          setContactData({
            fields: newFields,
            initialValues: getObjKeys('', newFields)
          });
          setTimeout(() => setLoading(false), 500);
        }
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (contactId && isClone) {
      axiosInstance()
        .get(`/${contactApi}/${contactId}`)
        .then(({ data: { data } }) => {
          const { _id, firstName, lastName, middleName, email, reportsTo, ...rest } = data;

          setCloneHeading(`${firstName ?? ''} ${middleName ?? ''} ${lastName ?? ''}`);
        });
    }
  });

  const getContactCloneData = (newFields) => {
    if (contactId) {
      setLoading(false);
      axiosInstance()
        .get(`/${contactApi}/${contactId}`)
        .then(({ data: { data } }) => {
          const { _id, firstName, lastName, middleName, email, reportsTo, ...rest } = data;

          let tempData = { ...rest };

          setContactData({
            fields: newFields,
            initialValues: getObjKeysWithValues(tempData, newFields)
          });
          setTimeout(() => setLoading(false), 500);
        });
    }
  };

  const onReportsToDropdownOpen = (selectedAccount) => {
    setReportsToDataSource(reportsToMainDataSource.filter((d) => d.parentAccount === selectedAccount));
  };

  const handleGetAddedContact = (data, selectedAccount) => {
    if (data?._id) {
      let tempReportsToMainDataSource = [
        ...reportsToMainDataSource,
        {
          optionValue: data._id,
          optionLabel: `${data?.salutation ?? ''} ${data?.firstName ?? ''} ${data?.middleName ?? ''} ${data?.lastName ?? ''}`,
          parentAccount: data.accountName,
          email: data?.email,
          order: reportsToMainDataSource.length,
          default: false
        }
      ];
      setReportsToMainDataSource([...tempReportsToMainDataSource]);
      setReportsToDataSource(tempReportsToMainDataSource.filter((d) => d.parentAccount === selectedAccount));
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  const handleCreateContact = (values) => {
    setLoading(true);
    axiosInstance()
      .post(`/${contactApi}`, values)
      .then(({ data }) => {
        if (isGetContactData) {
          onGetAddedContact(data.data);
        }
        const newId = data.data._id;
        onClose({ fetch: true });
        onSuccess({ fetch: true, id: newId, data: data });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        if (isRedirectToDetailPage) {
          history.push(`${contactApi}/detail/${newId}`);
        }
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const onSubmit = (values) => {
    if (handleSubmit) {
      setLoading(true);
      handleSubmit(values, false)
    } else {
      handleCreateContact(values)
    }
  }

  return (
    <>
      <Dialog
        maxWidth="md"
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={true}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        {contactData?.fields?.length > 0 ? (
          <>
            <Formik initialValues={contactData.initialValues} validationSchema={yupSchema(contactData.fields)} validateOnMount onSubmit={onSubmit}>
              {({ submitForm, values, errors, touched, setFieldValue }) => (
                <>
                  <CustomDialogHeader
                    onClose={() => {
                      if (isEqual(contactData.initialValues, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                    title={
                      isClone
                        ? `Clone - ${cloneHeading}`
                        : isNew
                          ? contactResource === 'customerContact'
                            ? `Add ${routes?.customerContact?.title}`
                            : `Add ${routes?.supplierContact?.title}`
                          : `Edit ${contactData?.initialValues?.firstName ?? ''} ${contactData?.initialValues?.lastName ?? ''}`
                    }
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                      setFullScreen((prevState) => !prevState);
                    }}
                    showManimizeMaximize={true}
                  />
                  <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      {formsData &&
                        formsData
                          ?.filter((item) => item.name !== additionalFieldName)
                          .map((form, i) => (
                            <div key={i}>
                              <div className={'detail-box-content'}>
                                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                              </div>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field) => (
                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                      {field?.fieldName === 'reportsTo' ? (
                                        <Grid container spacing={1}>
                                          <Grid
                                            item
                                            xs={permissions[accountResource].isCreate ? 11 : 11}
                                            sm={permissions[accountResource].isCreate ? 11 : 11}
                                            md={permissions[accountResource].isCreate ? 11 : 11}
                                          >
                                            <FormTypes
                                              isNew={isNew}
                                              {...field}
                                              disabled={!isNew && field.disableOnEdit}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={reportsToDataSource}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                              onOpen={() => onReportsToDropdownOpen(values.accountName)}
                                            />
                                          </Grid>
                                          {permissions[accountResource].isCreate && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip title="Create Reports To" className={`mt-1`}>
                                                <IconButton
                                                  onClick={() => setShowContactDialog(true)}
                                                  size="small"
                                                  disabled={!isNew && field.disableOnEdit}
                                                >
                                                  <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
                                                </IconButton>
                                              </Tooltip>
                                            </Grid>
                                          )}
                                          {field?.tooltipMessage ? (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </Tooltip>
                                            </Grid>
                                          ) : null}
                                        </Grid>
                                      ) : (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          disabled={!isNew && field.disableOnEdit}
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
                                          imageOrFileUploadCompletePercentage={
                                            ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                              ? (completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                              }
                                              : null
                                          }
                                          fieldData={field}
                                          fields={contactData?.fields}
                                        />
                                      )}
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </div>
                          ))
                      }
                    </Form>
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <Button
                      onClick={() => {
                        if (isEqual(contactData.initialValues, values)) onClose();
                        else setShowConfirmDialog(true);
                      }}
                      variant="outlined"
                      color="primary"
                      size="small"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={loading || uploadingImageOrFileProgress > 0}
                      onClick={(e) => {
                        e.preventDefault();
                        handleScroll(errors);
                        submitForm();
                      }}
                    >
                      Save
                    </Button>
                  </CustomDialogFooter>
                  {showConfirmDialog ? (
                    <ConfirmationCancelDialog
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
                  {showContactDialog && (
                    <ManageContactDialog
                      onClose={() => setShowContactDialog(false)}
                      isGetContactData={true}
                      onGetAddedContact={(data) => {
                        setFieldValue('accountName', data?.accountName);
                        setFieldValue('reportsTo', data._id);
                        handleGetAddedContact(data, data?.accountName);
                      }}
                      contactResource={contactResource}
                      account={account}
                    />
                  )}
                </>
              )}
            </Formik>
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
}
