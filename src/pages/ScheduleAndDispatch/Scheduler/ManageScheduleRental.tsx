import { Box, Button } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { Fragment, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
import InputField from 'src/components/Helpers/InputField';
import { GenerateResourceLineNumber, getObjKeys, sidebarResource, yupSchema } from 'src/constants/helpers';
import { CollapsibleWrapper, ACCORDION_TYPE } from 'src/pages/ScheduleAndDispatch/Scheduler/helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ManageScheduleRental = ({ isExpand, handleSave, loading, handleOpen, user }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: null });
  const toastConfig = useContext(CustomToastContext);
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
      <CollapsibleWrapper
        index={4}
        title={'Customer Detail'}
        isExpand={isExpand}
        accordionType={ACCORDION_TYPE.customerDetail}
        handleOpen={handleOpen}
      >
        {initialData?.fields?.length ? (
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData?.fields)} validateOnMount onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
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
                <div className="flex justify-end gap-2">
                  <Button
                    disabled={false}
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      handleOpen('technician');
                    }}
                  >
                    Back
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </div>
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CollapsibleWrapper>
    </>
  );
};

export default ManageScheduleRental;
