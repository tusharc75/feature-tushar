import React, { useEffect, useState, useContext, Fragment, useRef } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { Formik, Form } from 'formik';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import {
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  opportunity,
  setFieldsInAscendingOrder,
  GenerateResourceLineNumber
} from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
export default function ManageOpportunityDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  isRedirectTodetailPage,
  userId = null,
  contactId = null,
  contactResource = null,
  disableOwnerAndAccount = false,
  opportunityId,
  isClone = false
}) {
  const { opportunityApi } = opportunity;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();

  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [cloneHeading, setCloneHeading] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(async ({ data: { data } }) => {
        const process = data.find((obj) => obj?.fieldData?.type === 'process')?.fieldData;
        if (process) {
          data = data?.filter((e) => e.fieldData.sectionName !== process?.additionalInfoSection);
        }

        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (opportunityId) {
          var opportunityData: any = await axiosInstance().get(`${opportunityApi}/${opportunityId}?entity=${selectedEntity}`);
          opportunityData = opportunityData?.data?.data;
          if (isClone) {
            const { opportunityName, ...rest } = opportunityData;
            rest['opportunityName'] = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(opportunityName);
            setInitialData({
              fields: fieldsDataForUpdate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: { ...getObjKeysWithValues(opportunityData, fieldsDataForUpdate) }
            });
          }
        } else {
          let initialData = { ...getObjKeys('', fieldsDataForCreate) };
          initialData['opportunityName'] = GenerateResourceLineNumber(fieldsDataForCreate);
          setInitialData({
            fields: fieldsDataForCreate,
            values: initialData
          });
        }
      });
  }, []);

  const handleSubmit = (values) => {
    if (isNew) {
      if (contactId && contactResource) {
        values.staticData = { [contactResource]: [contactId] };
      }
      setLoading(true);
      axiosInstance()
        .post(`${opportunityApi}?entity=${selectedEntity}`, values)
        .then(({ data }) => {
          const newId = data.data._id;
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          if (isRedirectTodetailPage) history.push(`${opportunityApi}/detail/${newId}`);
          onSuccess(data);
          setTimeout(() => setLoading(false), 500);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    } else {
      values = { ...values, _id: dataToUpdate._id };
      setLoading(true);
      axiosInstance()
        .put(`${opportunityApi}?entity=${selectedEntity}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
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

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
      >
        {initialData?.fields?.length ? (
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
            {({ submitForm, values, errors, touched, setFieldValue }) => (
              <Fragment>
                <CustomDialogHeader
                  title={isClone ? `Clone - ${cloneHeading}` : isNew ? 'Create Opportunity' : `Editing ${dataToUpdate.opportunityName}`}
                  onClose={(e, reason) => {
                    if (!isEqual(values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={setFieldValue}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                      resource={resource}
                      referenceId={opportunityId}
                    />
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (!isEqual(values, initialData.values)) {
                        setShowConfirmDialog(true);
                      } else {
                        onClose();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
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
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
}

ManageOpportunityDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool
};
