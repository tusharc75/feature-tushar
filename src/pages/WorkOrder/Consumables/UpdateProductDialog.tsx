import { Fragment, useEffect, useState } from 'react';
import { Box, Button, Dialog } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { CHILD_RESOURCE, CustomDialogTransition, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { uniq, map, orderBy } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';

const UpdateProductDialog = ({ onClose, materialData, handleUpdate, loadingEdit, workOrderData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, [materialData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderProduct, workOrderData?.currency, true);
    setInitialData({
      fields: data,
      values: getObjKeysWithValues(materialData, data)
    });
    EvaluteFields(data);
  };

  const EvaluteFields = (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData);
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={async (values) => {
            await handleUpdate({ _id: materialData._id, ...values });
          }}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={`Edit - ${materialData?.product || ''}`}
                onClose={() => {
                  onClose();
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    onClose();
                  }}
                >
                  {'Close'}
                </Button>
                <CustomButton
                  loading={loadingEdit}
                  disabled={loadingEdit}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={() => {
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
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

export default UpdateProductDialog;
