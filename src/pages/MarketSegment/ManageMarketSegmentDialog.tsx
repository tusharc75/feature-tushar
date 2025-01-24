import { useState, useEffect, Fragment, useContext } from 'react';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, marketSegment, sidebarResource } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box } from '@mui/material';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import InputField from 'src/components/Helpers/InputField';

const ManageMarketSegmentDialog = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();
  const { marketSegmentId, onClose, onSuccess, isClone = false } = props;
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=Market Segment`)
      .then(({ data: { data } }) => {
        const fieldsData = marketSegmentId
          ? data.filter((d) => d.isUpdate).map((d: any) => d.fieldData)
          : data.filter((d) => d.isCreate).map((d: any) => d.fieldData);
        if (marketSegmentId) {
          let tempOptionArray = fieldsData.find((d) => d.fieldName === 'parentMarketSegment').option;
          fieldsData.find((d) => d.fieldName === 'parentMarketSegment').option = tempOptionArray.filter(
            (data) => data.optionValue !== marketSegmentId
          );
          axiosInstance()
            .get(`${marketSegment.marketSegmentApi}/` + marketSegmentId)
            .then(({ data: { data } }) => {
              let tempData = { ...data };
              if (isClone) {
                const { _id, createdBy, history, name, ...rest } = tempData;
                tempData = { ...rest };
              }
              setInitialData({
                fields: fieldsData,
                values: isClone ? getObjKeysWithValues(tempData, fieldsData, true, user) : getObjKeysWithValues(tempData, fieldsData)
              });
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setInitialData({
            fields: fieldsData,
            values: getObjKeys('', fieldsData)
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [marketSegmentId]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (marketSegmentId && !isClone) {
      values._id = marketSegmentId;
      axiosInstance()
        .put(`${marketSegment.marketSegmentApi}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${marketSegment.marketSegmentApi}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess(data);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
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
      {initialData && initialData.fields.length ? (
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
                title={
                  isClone
                    ? 'Clone'
                    : marketSegmentId
                      ? 'Update ' + resources?.marketSegment?.titleSingular
                      : 'Create ' + resources?.marketSegment?.titleSingular
                }
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
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
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.marketSegment}
                    referenceId={marketSegmentId || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton disabled={loading} isLoading={loading} buttonType="theme" onClick={submitForm}>
                  {' '}
                  Save
                </ThemeButton>
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
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageMarketSegmentDialog;
