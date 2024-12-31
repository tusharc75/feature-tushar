import { Box } from '@mui/material';
import { Form, Formik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { GenerateResourceLineNumber, getObjKeys, sidebarResource, yupSchema } from 'src/constants/helpers';
import { SchedularComponentProps } from 'src/pages/ScheduleAndDispatch/Scheduler/types';

const ManageScheduleRental = ({ schedularState }: SchedularComponentProps) => {
  const { loading, setActiveTab, handleSave, getTabData, toastConfig, user } = schedularState;
  const tabData = useMemo(() => getTabData('customerDetail'), [getTabData]);

  const [initialData, setInitialData] = useState({ fields: [], values: null });
  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.rentalManagement}`)
      .then(({ data: { data } }) => {
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

        let createValues: any = getObjKeys('', fieldsDataForCreate);
        createValues['rentalJobName'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          createValues['currency'] = user.user?.brandCurrency;
        }

        fieldsDataForCreate = fieldsDataForCreate?.filter((_f) => _f.required && !createValues[_f.fieldName] && _f.fieldName !== 'warehouse');
        setInitialData({
          fields: fieldsDataForCreate,
          values: createValues
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = async (values, { resetForm }) => {
    const updatedData = { ...initialData.values, ...values };
    try {
      await handleSave(updatedData);
      resetForm();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <h6 className="mb-[18px] text-xl font-semibold leading-6">{tabData?.label}</h6>
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData?.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <div className="min-h-[--loader-h]">
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </div>
              <div className="flex  justify-end gap-2">
                <ThemeButton
                  disabled={false}
                  buttonType="transparent"
                  onClick={() => {
                    schedularState?.tabs?.find((t) => t.key === 'technicians')?.show ? setActiveTab('technicians') : setActiveTab('services');
                  }}
                >
                  Back
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
                  buttonType="theme"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </div>
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} className="h-[--loader-h]">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default ManageScheduleRental;
