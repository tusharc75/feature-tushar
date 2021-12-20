import { useState, useEffect, Fragment, useContext, useRef, useMemo } from 'react';
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
import { throttle } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { address, CustomDialogTransition, setFieldsInAscendingOrder } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, isFieldNotTouched } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';

const ManageAddressDialog = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const placesService = useRef(null)
  const { onClose, onSuccess } = props;
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [placeId, setPlaceId] = useState(null)
  const [formikRef, setFormikRef] = useState(null)

  useEffect(() => {
    if (initialData.fields.length > 0) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=Address`)
      .then(({ data: { data } }) => {
        const fieldsData = data.filter((d) => d.isCreate).map((d: any) => d.fieldData);
        setInitialData({
          fields: fieldsData,
          values: getObjKeys('', fieldsData)
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    setLoading(true);
    axiosInstance()
      .post(`${address.addressApi}`, values)
      .then(({ data: { data } }) => {
        setLoading(false);
        onSuccess(data);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };


  const fetchPlace = useMemo(() => throttle((req, cb) => {
    placesService.current.getDetails(req, cb)
  }, 200), [])


  useEffect(() => {
    let active = true

    if (placeId) {
      if (!placesService.current && window.google) {
        const element = document.createElement('div')
        placesService.current = new window.google.maps.places.PlacesService(element)
      }

      if (!placesService.current && !placeId) {
        return undefined
      }

      fetchPlace({ placeId }, (results) => {
        if (active) {
          type addressType = {
            long_name: string,
            short_name: string,
            types: any[]
          }
          const fullAddress = {}
          const addressess = results.address_components

          addressess.forEach((address: addressType) => {
            fullAddress[address.types[0]] = address.long_name;
          })

        }
      });
    }

    return () => {
      active = false
    }
  }, [placeId])


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
      {initialData.fields.length ? (
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
                title={'Create '}
                onClose={() => {
                  if (
                    isFieldNotTouched(
                      {
                        fields: initialData.fields,
                        initialValues: initialData.values
                      },
                      values
                    )
                  )
                    onClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form noValidate>
                  {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}
                  {formsData &&
                    formsData.map((form, index1) => {
                      return form.name ? (
                        <div key={index1}>
                          <div className={'detail-box-content'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  {
                                    <FormTypes
                                      // {...rest}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      imageOrFileUploadCompletePercentage={null}
                                      onChange={(_, val) => {
                                        if (field.fieldName === "fullAddress" && typeof val === 'object') {
                                          setPlaceId(val?.place_id ?? null)
                                        } else {
                                          return null
                                        }
                                      }}
                                    />
                                  }
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      ) : (
                        form.sectionFields.map((field) => (
                          <FormTypes
                            // {...rest}
                            values={values}
                            errors={errors}
                            touched={touched}
                            label={field.fieldLabel}
                            name={field.fieldName}
                            type={field.type}
                            options={field.option}
                            setFieldValue={setFieldValue}
                            required={field.required}
                            fullWidth
                            isTooltip={field?.isTooltip || false}
                            tooltipMessage={field?.tooltipMessage}
                            size="small"
                            style={{ visibility: 'hidden' }}
                          />
                        ))
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    if (
                      isFieldNotTouched(
                        {
                          fields: initialData.fields,
                          initialValues: initialData.values
                        },
                        values
                      )
                    )
                      onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton disabled={loading} loading={loading} variant="contained" color="primary" type="submit" onClick={submitForm}>
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
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageAddressDialog;
