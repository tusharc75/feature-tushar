import { useState, useEffect, Fragment, useContext, FC } from 'react';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from 'src/components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  transferInventory,
  setFieldsInAscendingOrder,
  GenerateResourceLineNumber,
  TRANSFER_INVENTORY_STATUS
} from 'src/constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Box } from '@mui/material';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import { useData } from 'src/StateProvider/Provider';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

interface Props {
  isClone?: boolean;
  transferInventoryId?: any;
  onClose?: any;
  onSuccess?: any;
  referenceType?: string;
  referenceId?: string;
  referenceData?: any;
}

const ManageTransferInventory: FC<Props> = (props) => {
  const { isClone = false, transferInventoryId = null, onClose, onSuccess, referenceType = null, referenceId = null, referenceData = null } = props;

  const {
    state: { selectedEntity, permissions, user, resources }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [cloneHeading, setCloneHeading] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  //const [customerPlants, setCustomerPlants] = useState([]);
  //const [isCustomer, setCustomer] = useState(false);
  // useEffect(() => {
  //   if (!user || !user?.user || !user?.user?.customerAccountId || !user?.user?.customerContactId) return;
  //   setCustomer(true);
  //   const fetchPlants = () => {
  //     axiosInstance()
  //       .get(`${routes.warehouse.path}/customer-account`)
  //       .then(({ data: { data } }) => {
  //         data = data?.map((d: any, index) => ({
  //           ...d,
  //           optionValue: d?.warehouse,
  //           optionLabel: d?.warehouseDetail?.warehouseName,
  //           address: d?.warehouseDetail?.address?.optionValue,
  //           entity: d?.entity,
  //           order: index,
  //           default: false
  //         }));
  //         setCustomerPlants(data);
  //       })
  //       .catch((err) => {
  //         toastConfig.setToastConfig(err);
  //       });
  //   };

  //   fetchPlants();
  // }, [user]);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Transfer Inventory')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (transferInventoryId) {
          axiosInstance()
            .get(`${transferInventory.api}/` + transferInventoryId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, entity, transferNumber, ...rest } = data;
                let oldValues = { ...rest };
                oldValues.transferNumber = GenerateResourceLineNumber(fieldsDataForCreate);
                oldValues.status = TRANSFER_INVENTORY_STATUS.new;
                setCloneHeading(transferNumber);
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(oldValues, fieldsDataForCreate, true, user)
                });
              } else {
                if (!data?.canEdit) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['transferFromPlant', 'transferFromStorageLocation']?.includes(e?.fieldName)) {
                      e.isUneditable = true;
                    }
                  });
                }
                if (!data?.canEditDeliveryTo) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['transfertoPlant', 'transferToStorageLocation']?.includes(e?.fieldName)) {
                      e.isUneditable = true;
                    }
                  });
                }
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
          setAllFields(fieldsDataForUpdate);
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          setAllFields(fieldsDataForCreate);
          createValues.transferNumber = GenerateResourceLineNumber(fieldsDataForCreate);
          createValues.status = 'New';
          if (referenceType === 'Rental Job' && referenceData) {
            for (const key in referenceData) {
              if (referenceData[key] && fieldsDataForCreate?.some((e) => e.fieldName === key)) {
                createValues[key] = referenceData[key];
              }
            }
            fieldsDataForCreate?.forEach((e) => {
              if (['rentalJob', 'transferFromPlant', 'transfertoPlant']?.includes(e.fieldName)) {
                e.disableOnEdit = true;
                e.isUneditable = true;
              }
            });
          }
          setInitialData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [transferInventoryId]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (transferInventoryId && isClone === false) {
      values._id = transferInventoryId;
      axiosInstance()
        .put(`${transferInventory.api}`, values)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${transferInventory.api}`, values)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess(data);
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const validate = (values) => {
    const errors = {};
    if (user?.user?.brandPolicy?.storageLocation) {
      if (values?.transferFromStorageLocation === values?.transferToStorageLocation) {
        errors['transferToStorageLocation'] = 'Transfer from and to storage location can not be same';
      }
    } else {
      if (values?.transferFromPlant === values?.transfertoPlant) {
        errors['transfertoPlant'] = 'Transfer from and to plant can not be same';
      }
    }
    return errors;
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
        <Formik initialValues={initialData.values} validationSchema={yupSchema(allFields)} onSubmit={handleSubmit} validate={validate}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  transferInventoryId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update - ${values?.transferNumber}`
                    : 'Create ' + resources?.transferInventory?.titleSingular
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
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={allFields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  id="dialog-cancel-button"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  id="dialog-save-button"
                  onClick={submitForm}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
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
              )}
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

export default ManageTransferInventory;
