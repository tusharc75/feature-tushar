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

const OnlyAddressDropdownInDialog = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { onClose, onSuccess, isEdit, isClone, addressData: oldData, title } = props;
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [addressData, setAddressData] = useState(null);

  const formikRef = {
    current: null
  };

  useEffect(() => {
    if (initialData.fields.length > 0) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {

    const fieldsCreateData = [{
      "fieldName": "fullAddress",
      "fieldLabel": "Full Address",
      "required": true,
      "unique": true,
      "type": "location",
      "editAble": false,
      "defaultValue": "",
      "disableOnEdit": false,
      "hiddenField": false,
      "isDefaultValue": false,
      "primaryField": true,
      "lookup": false,
      "lookupResource": "",
    }]

    setInitialData({
      fields: fieldsCreateData,
      values: getObjKeys('', fieldsCreateData)
    });

  }, []);

  const handleSubmit = (values) => {
    // const {zipCodePostalCode, stateProvince, ...restValues} = values
    onSuccess(values);
  };

  const getFullAddress = (placeId) => {
    if (placeId && window.google) {
      const element = document.createElement('div');
      let placesService = new window.google.maps.places.PlacesService(element);

      placesService.getDetails({ placeId }, (results) => {
        type addressType = {
          long_name: string;
          short_name: string;
          types: any[];
        };

        const addressess = results.address_components;
        let fullAddress: any = {};

        addressess.forEach((address: addressType) => {
          const type = address.types[0];

          if (type === 'locality') {
            fullAddress.city = address.long_name;
          }

          // if (type === 'administrative_area_level_1') {
          //   fullAddress['state/Province'] = address.long_name;
          // }

          if (type === 'administrative_area_level_2') {
            fullAddress.county = address.long_name;
          }

          if (type === 'country') {
            fullAddress.country = address.long_name;
          }

          // if (type === 'postal_code') {
          //   fullAddress['zipCode/PostalCode'] = address.long_name;
          // }
        });

        fullAddress.latitude = results.geometry.location.lat().toLocaleString();
        fullAddress.longitude = results.geometry.location.lng().toLocaleString();
        fullAddress.streetAddress = results.formatted_address;

        setAddressData(fullAddress);
      });
    }
  };

  useEffect(() => {
    if (formikRef.current && addressData) {
      const setFieldValue = formikRef.current.setFieldValue;
      if (addressData?.streetAddress) {
        setFieldValue('streetAddress', addressData.streetAddress);
      } else {
        setFieldValue('city', '');
      }
      if (addressData?.city) {
        setFieldValue('city', addressData.city);
      } else {
        setFieldValue('city', '');
      }
      // if (addressData['state/Province']) {
      //   setFieldValue('state/Province', addressData['state/Province']);
      // } else {
      //   setFieldValue('state/Province', '');
      // }
      if (addressData?.country) {
        setFieldValue('country', addressData.country);
      } else {
        setFieldValue('country', '');
      }
      // if (addressData['zipCode/PostalCode']) {
      //   setFieldValue('zipCode/PostalCode', addressData['zipCode/PostalCode']);
      // } else {
      //   setFieldValue('zipCode/PostalCode', '');
      // }
      if (addressData?.latitude) {
        setFieldValue('latitude', addressData.latitude);
      } else {
        setFieldValue('latitude', '');
      }
      if (addressData?.longitude) {
        setFieldValue('longitude', addressData.longitude);
      } else {
        setFieldValue('longitude', '');
      }
    }
  }, [addressData]);

  return (
    <Dialog
      maxWidth="sm"
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
                title={title ? title : 'Add Address'}
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
                showManimizeMaximize={false}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form noValidate>

                  <Box marginY={2}>
                    <Grid spacing={3} container>
                      <Grid item xs={12}>
                        <FormTypes
                          values={values}
                          errors={errors}
                          touched={touched}
                          label="Full Address"
                          name="fullAddress"
                          type="location"
                          options={[]}
                          setFieldValue={setFieldValue}
                          required={true}
                          fullWidth
                          isTooltip={false}
                          size="small"
                          imageOrFileUploadCompletePercentage={null}
                          onChange={(_, val) => {
                            if (typeof val !== 'object') return;
                            const placeId = val?.place_id ?? null;
                            getFullAddress(placeId);
                            if (!placeId) {
                              setAddressData(null);
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

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
                  Select
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

export default OnlyAddressDropdownInDialog;
