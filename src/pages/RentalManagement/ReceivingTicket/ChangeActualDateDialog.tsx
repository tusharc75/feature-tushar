import { Form, Formik } from 'formik';
import { Dialog, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import { useData } from 'src/StateProvider/Provider';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

const ChangeActualDateDialog = ({ data, onClose, handleSubmit, loading, isBulkUpdate, records, rentalId }) => {
  const {
    state: { user }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);

  const [minStartDate, setMinStartDate] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (user?.user?.brandPolicy?.rentalDateChangeInAssetHistory) {
      let assets = records?.filter((e) => e.type === 'Asset')?.map((e) => e._id);
      if (assets) {
        fetchAssetRentalDate(assets);
      }
    }
  }, []);

  const fetchAssetRentalDate = (assets) => {
    setLoadingData(true);
    axiosInstance()
      .put(`${routes?.serializedAsset?.path}/asset-last-history-date-before-adding`, { referenceId: rentalId, assets: assets })
      .then(({ data: { data } }) => {
        if (data?.date) {
          const date = new Date(data?.date);
          date.setHours(0, 0, 0);
          setMinStartDate(date);
        }
        setLoadingData(false);
      })
      .catch((err) => {
        setLoadingData(false);
        toastConfig.setToastConfig(err);
      });
  };

  function validate(values) {
    const errors = {};
    if (data?.isAllowedStartDate && data?.isAllowedEndDate) {
      let manualStartDate = dayjs(values?.manualStartDate);
      let manualEndDate = dayjs(values?.manualEndDate);
      if (manualEndDate.diff(manualStartDate, 'days') < 0) {
        errors['manualEndDate'] = 'Please enter valid end date';
      }
    }
    if (minStartDate) {
      let manualStartDate = dayjs(values?.manualStartDate);
      let newMinStartDate = dayjs(minStartDate);
      if (manualStartDate.diff(newMinStartDate, 'days') < 0) {
        errors['manualStartDate'] = 'Please enter valid start date';
      }
    }
    return errors;
  }

  return (
    <Dialog
      open={true}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      {!loadingData ? (
        <Formik
          initialValues={
            data?.isAllowedStartDate && data?.isAllowedEndDate
              ? {
                manualStartDate: new Date(data?.manualStartDate),
                manualEndDate: new Date(data?.manualEndDate)
              }
              : data?.isAllowedStartDate
                ? { manualStartDate: new Date(data?.manualStartDate) }
                : data?.isAllowedEndDate
                  ? { manualEndDate: new Date(data?.manualEndDate) }
                  : {}
          }
          validate={validate}
          onSubmit={(values) => {
            const newValues: any = {};
            if (data.isAllowedStartDate) {
              newValues.manualStartDate = new Date(values.manualStartDate)?.toISOString();
            }
            if (data.isAllowedEndDate) {
              newValues.manualEndDate = new Date(values.manualEndDate)?.toISOString();
            }
            handleSubmit(newValues);
          }}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Form>
              <CustomDialogHeader
                title={isBulkUpdate ? 'Update Start Date/End Date' : data?.assetNumber ? data?.assetNumber : ''}
                onClose={onClose}
              />
              <CustomDialogContent>
                <Box p={2}>
                  <Grid container spacing={2}>
                    {data?.isAllowedStartDate && (
                      <Grid size={{ xs: 12, sm: 12 }}>
                        <FormTypes
                          size="small"
                          fullWidth
                          values={values}
                          errors={errors}
                          touched={touched}
                          type="date"
                          label="Start Date"
                          name="manualStartDate"
                          onChange={(date) => {
                            setFieldValue('manualStartDate', date);
                          }}
                          {...(values.manualEndDate ? { maxDate: values.manualEndDate } : {})}
                          {...(minStartDate ? { minDate: minStartDate } : {})}
                        />
                      </Grid>
                    )}
                    {data?.isAllowedEndDate && (
                      <Grid size={{ xs: 12, sm: 12 }}>
                        <FormTypes
                          size="small"
                          fullWidth
                          minDate={data?.minEndDate || values.manualStartDate}
                          values={values}
                          errors={errors}
                          touched={touched}
                          type="date"
                          label="End Date"
                          name="manualEndDate"
                          onChange={(date) => {
                            setFieldValue('manualEndDate', date);
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  onClick={onClose}
                  buttonType='transparent'
                >
                  Close
                </ThemeButton>
                <ThemeButton
                  onClick={submitForm}
                  disabled={loading}
                  buttonType='theme'
                  isLoading={loading}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      ) : (
        <Box p={2} height={200}>
          <CommonSkeleton lenArray={[...Array(3).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ChangeActualDateDialog;
