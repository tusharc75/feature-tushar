import { useState, useEffect, Fragment, useContext, useCallback } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import { GoogleMap, Marker } from '@react-google-maps/api';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import { address, CustomDialogTransition, setFieldsInAscendingOrder } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, isFieldNotTouched } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';

const ManageAddressDialog = ({ onClose, onSuccess, addressData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [addressDetail, setAddressDetail] = useState(null);

  const formikRef = {
    current: null
  };

  useEffect(() => {
    if (initialData.fields.length > 0) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=Address`)
      .then(({ data: { data } }) => {
        const fieldsCreateData = data.filter((d) => d.isCreate).map((d: any) => d.fieldData);
        const fieldsEditData = data.filter((d) => d.isUpdate).map((d: any) => d.fieldData);
        if (addressData) {
          setInitialData({
            fields: fieldsEditData,
            values: getObjKeysWithValues(addressData, fieldsEditData)
          });
        } else {
          setInitialData({
            fields: fieldsCreateData,
            values: getObjKeys('', fieldsCreateData)
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    // const {zipCodePostalCode, stateProvince, ...restValues} = values
    setLoading(true);
    if (addressData) {
      values._id = addressData._id;
      axiosInstance()
        .put(`${address.addressApi}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess(data);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${address.addressApi}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess(data);
        })
        .catch((error) => {
          setLoading(false);
          if (error?.data?.isAlreadyExist) {
            values['isAlreadyExist'] = true;
            values['_id'] = error?.data?.alreadyExistId;
            onSuccess(values);
          } else {
            toastConfig.setToastConfig(error);
          }
        });
    }
  };

  const getFullAddress = (val: any) => {
    if (val?.place_id && window.google) {
      const { place_id: placeId } = val;
      const element = document.createElement('div');
      let placesService = new window.google.maps.places.PlacesService(element);
      placesService.getDetails({ placeId }, (results) => {
        setFullAddressFields(results, val);
      });
    }
  };

  const setFullAddressFields = (results: any, val?: any) => {
    type addressType = {
      long_name: string;
      short_name: string;
      types: string[];
    };
    const addressess = results.address_components;

    let fullAddress: any = { ...initialData.values };
    addressess.forEach((address: addressType) => {
      const type = address.types;
      if (type.includes('locality')) {
        fullAddress.city = address.long_name;
      }
      // if (type.includes('administrative_area_level_1')) {
      //   if(initialData.values.hasOwnProperty("state")) {
      //     fullAddress['state'] = address.long_name;
      //   } else {
      //     fullAddress['state/Province'] = address.long_name;
      //   }
      // }
      if (type.includes('administrative_area_level_2')) {
        fullAddress.county = address.long_name;
      }
      if (type.includes('country')) {
        fullAddress.country = address.long_name;
      }
      // if (type === 'postal_code') {
      //   if(initialData.values.hasOwnProperty("zipCode")) {
      //     fullAddress['zipCode'] = address.long_name;
      //   } else {
      //     fullAddress['zipCode/PostalCode'] = address.long_name;
      //   }
      // }
    });
    fullAddress.latitude = results.geometry.location.lat().toLocaleString();
    fullAddress.longitude = results.geometry.location.lng().toLocaleString();
    fullAddress.streetAddress = results.formatted_address;
    fullAddress.fullAddress = val?.description ?? results.formatted_address;
    setAddressDetail(fullAddress);
  };

  useEffect(() => {
    if (formikRef.current && addressDetail) {
      const setFieldValue = formikRef.current.setFieldValue;
      const keys = Object.keys(addressDetail);
      if (keys.length > 0) {
        Object.keys(initialData.values).forEach((k) => {
          setFieldValue(k, addressDetail[k]);
        });
      }
    }
  }, [addressDetail]);

  const onCordChange = (position: google.maps.MapMouseEvent) => {
    if (!formikRef.current || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: position.latLng }, (result, status) => {
      if (status === google.maps.GeocoderStatus.OK) {
        console.log(result);
        setFullAddressFields(result[1]);
      }
    });
  };

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
          innerRef={(ref) => {
            if (ref) {
              formikRef.current = ref;
            }
          }}
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={addressData ? 'Edit Address' : 'Add Address'}
                onClose={() => {
                  if (
                    isFieldNotTouched(
                      {
                        fields: initialData.fields,
                        initialValues: initialData.values
                      },
                      values
                    )
                  ) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form noValidate>
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
                                      onChange={
                                        field.fieldName === 'fullAddress'
                                          ? (_, val) => {
                                              if (typeof val !== 'object') return;
                                              getFullAddress(val);
                                              if (!val?.place_id) {
                                                setAddressDetail(null);
                                              }
                                            }
                                          : null
                                      }
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
                <div>
                  <p>Drag or click to select new coordinates</p>
                  <Box height={400} width={'100%'} borderRadius={4} overflow="hidden">
                    <GoogleMap
                      onClick={(position) => onCordChange(position)}
                      options={{
                        disableDefaultUI: true,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        mapTypeControlOptions: {
                          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
                        },
                        styles: [
                          {
                            featureType: 'water',
                            stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
                          },
                          { featureType: 'landscape', stylers: [{ color: '#f2f2f2' }] },
                          {
                            featureType: 'road',
                            stylers: [{ saturation: -100 }, { lightness: 45 }]
                          },
                          {
                            featureType: 'road.highway',
                            stylers: [{ visibility: 'simplified' }]
                          },

                          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
                        ],
                        gestureHandling: 'cooperative'
                      }}
                      mapContainerStyle={{
                        minHeight: '500px',
                        height: '100%',
                        maxWidth: '600px',
                        minWidth: '100%'
                      }}
                      // onLoad={onLoad}
                      // onUnmount={onUnmount}
                      center={
                        addressDetail?.latitude && addressDetail?.longitude
                          ? new google.maps.LatLng(addressDetail?.latitude, addressDetail?.longitude)
                          : new google.maps.LatLng(37.09, -95.713)
                      }
                      zoom={4}
                    >
                      {addressDetail?.latitude && addressDetail?.longitude && (
                        <Marker
                          draggable
                          onDragEnd={(position) => onCordChange(position)}
                          position={new google.maps.LatLng(addressDetail?.latitude, addressDetail?.longitude)}
                        />
                      )}
                    </GoogleMap>
                  </Box>
                </div>
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
                    ) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
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
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageAddressDialog;
