import { Autocomplete, Box, Dialog, IconButton, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDatePicker from 'src/components/CustomDatePicker';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { date, object, string } from 'yup';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ManageScheduleMaintenanceType from 'src/pages/ScheduleMaintenance/ScheduleMaintenanceType/ManageScheduleMaintenanceType';

const Schema = object().shape({
  effectiveDate: date().required('please enter Effective Date'),
  duration: string().required('please select Duration'),
  maintenanceType: string().required('please select Maintenance Type')
});

const DURATION = ['Monthly', 'Quarterly', 'Yearly'];

const ManageScheduleMaintenance = ({ data = null, handleClose, handleSave, loading }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ effectiveDate: '', duration: '', maintenanceType: '' });
  const [scheduledMaintenanceTypeOptions, setScheduledMaintenanceTypeOptions] = useState([]);
  const [openScheduledMaintenanceType, setOpenScheduledMaintenanceType] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get(`/scheduled-maintenance-type`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setScheduledMaintenanceTypeOptions(data?.map((d) => ({ optionLabel: d?.name, optionValue: d?._id })));
        }
      })
      .catch((error) => { });
  }, []);


  useEffect(() => {
    if (data) {
      setInitialData({
        effectiveDate: data?.effectiveDate,
        duration: data?.duration,
        maintenanceType: data?.maintenanceTypeId
      });
    }
  }, [data]);

  const handleSubmit = (values) => {
    handleSave(values);
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <Formik enableReinitialize={true} initialValues={initialData} validationSchema={Schema} validateOnMount onSubmit={handleSubmit}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <>
            <CustomDialogHeader
              title={`${data?.productName ? data?.productName : data?.assetNumber ? data?.assetNumber : 'Schedule'}`}
              onClose={handleClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box p={1}>
                  <div className="flex items-center gap-2">
                    <div className="w-100">
                      <Autocomplete
                        id="maintenanceType"
                        options={scheduledMaintenanceTypeOptions}
                        size="small"
                        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                        isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                        value={
                          scheduledMaintenanceTypeOptions.filter((data) => data.optionValue === values['maintenanceType']).length
                            ? scheduledMaintenanceTypeOptions.filter((data) => data.optionValue === values['maintenanceType'])[0]
                            : ''
                        }
                        onChange={(event: any, newValue: any) => {
                          setFieldValue('maintenanceType', newValue?.optionValue || '');
                        }}
                        disabled={data ? true : false}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="maintenanceType"
                            size="small"
                            margin="dense"
                            label="Maintenance Type"
                            variant="outlined"
                            required
                            error={touched['maintenanceType'] && Boolean(errors['maintenanceType'])}
                            helperText={touched['maintenanceType'] && errors['maintenanceType']}
                          />
                        )}
                      />
                    </div>
                    {!data &&
                      <HtmlTooltip title={`Add`}>
                        <IconButton onClick={() => setOpenScheduledMaintenanceType(true)} size="small" color="primary">
                          <AddCircleIcon />
                        </IconButton>
                      </HtmlTooltip>
                    }
                  </div>
                  <Box mt={1}></Box>
                  <CustomDatePicker
                    fullWidth
                    size="small"
                    name={'effectiveDate'}
                    label={'Effective Date'}
                    value={values['effectiveDate']}
                    required
                    margin="dense"
                    onChange={(value: any) => {
                      setFieldValue('effectiveDate', value);
                    }}
                    error={touched['effectiveDate'] && Boolean(errors['effectiveDate'])}
                    helperText={touched['effectiveDate'] && errors['effectiveDate']}
                  />
                  <Box mt={1}></Box>
                  <Autocomplete
                    id="duration"
                    options={DURATION}
                    size="small"
                    value={values['duration']}
                    onChange={(event: any, newValue: any) => {
                      setFieldValue('duration', newValue || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="duration"
                        size="small"
                        margin="dense"
                        label="Duration"
                        variant="outlined"
                        required
                        error={touched['duration'] && Boolean(errors['duration'])}
                        helperText={touched['duration'] && errors['duration']}
                      />
                    )}
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={loading} buttonType="theme" onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
            {openScheduledMaintenanceType && (
              <ManageScheduleMaintenanceType
                handleClose={() => {
                  setOpenScheduledMaintenanceType(false);
                }}
                data={null}
                handleSuccess={(_data) => {
                  setScheduledMaintenanceTypeOptions([...scheduledMaintenanceTypeOptions, { optionLabel: _data?.name, optionValue: _data?._id }]);
                  setFieldValue('maintenanceType', _data?._id);
                  setOpenScheduledMaintenanceType(false);
                }}
              />
            )}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageScheduleMaintenance;
