import { useState, useEffect, Fragment, useContext, useRef, FC } from 'react';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, transferInventory, setFieldsInAscendingOrder, generateUniqueIdOnly } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues, resourceNames } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import { useData } from '../../StateProvider/Provider';
import ManageWarehouse from '../Warehouse/ManageWarehouse';
import { FaDiceOne } from 'react-icons/fa';

interface Props {
  isClone?: boolean;
  transferInventoryId?: any;
  onClose?: any;
  onSuccess?: any;
  number?: string;
  isEditable?: boolean;
  isMainInfoEditable?: boolean;
  refrenceType?: string;
  refrenceId?: string;
  refrenceData?: any;
}

const ManageTransferInvtransferInventory: FC<Props> = (props) => {
  const {
    state: { selectedEntity, permissions }
  }: any = useData();
  const { isClone = false, transferInventoryId = null, onClose, onSuccess, number = '' } = props;

  const toastConfig = useContext(CustomToastContext);
  const initialRender = useRef(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState(null);

  const [plantsCategoryOptions, setPlantsCategoryOptions] = useState([]);
  const [plantsToCategoryOptions, setPlantsToCategoryOptions] = useState([]);
  const [plantShipToOptions, setPlantShipToOptions] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('');
  const [transferToPlantOpen, setTransferToPlantOpen] = useState({ open: false, isClone: false });
  const [plantsOpen, setPlantsOpen] = useState({ open: false, isClone: false });

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

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
                oldValues.transferNumber = `TI_${generateUniqueIdOnly()}`;
                oldValues.status = 'New';
                setCloneHeading(transferNumber);
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(oldValues, fieldsDataForCreate)
                });
              } else {
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
          createValues.transferNumber = `TI_${generateUniqueIdOnly()}`;
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

  const isFieldNotTouched = (initialData, values) => {
    return (
      Object.values(simplifyValues(initialData.values, initialData?.fields[0]?.sectionFields || [])).toString() ===
      Object.values(simplifyValues(values, initialData?.fields[0]?.sectionFields || [])).toString()
    );
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
              setFormValues(ref.values);
            } else {
              setFormValues(null);
            }
          }}
          initialValues={initialData.values}
          validationSchema={yupSchema(allFields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm, setErrors }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  transferInventoryId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${resourceNames.transferInventory} (${number})`
                    : 'Create ' + resourceNames.transferInventory
                }
                onClose={() => {
                  if (isFieldNotTouched(initialData, values)) onClose();
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
                  {initialData.fields.length > 0 &&
                    initialData.fields.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container alignItems="center">
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                <FormTypes
                                  isNew={Boolean(transferInventoryId)}
                                  {...field}
                                  disabled={(Boolean(transferInventoryId) && field.disableOnEdit) 
                                    || field.fieldName === 'transferNumber'
                                    || field.fieldName === "status"
                                  }
                                  values={values}
                                  errors={errors}
                                  touched={touched}
                                  label={field.fieldLabel}
                                  name={field.fieldName}
                                  type={field.type}
                                  options={field.option}
                                  setFieldValue={(name, value) => {
                                    // handleValuesChange({ [name]: value })
                                    setFieldValue(name, value);
                                  }}
                                  required={field.required}
                                  fullWidth
                                  isTooltip={field?.isTooltip || false}
                                  tooltipMessage={field?.tooltipMessage}
                                  size="small"
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>

                        {transferToPlantOpen?.open && (
                          <ManageWarehouse
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={transferToPlantOpen?.open}
                            close={() => setTransferToPlantOpen({ open: false, isClone: false })}
                            isClone={transferToPlantOpen?.isClone}
                            onSuccess={async ({ data }) => {
                              setTransferToPlantOpen({ open: false, isClone: false });
                              setFieldValue('transfertoPlant', data._id);
                              const {
                                data: { data: addressData }
                              } = await axiosInstance().get(`warehouse/${data._id}`);
                              setPlantShipToOptions((prevState) => [
                                { ...addressData?.address, default: false, order: prevState.length },
                                ...prevState
                              ]);
                              setFieldValue('plantShipTo', data.address);
                              setPlantsToCategoryOptions((prevState) => {
                                return [
                                  ...prevState,
                                  {
                                    optionValue: data._id,
                                    optionLabel: data.warehouseName,
                                    order: plantsCategoryOptions.length,
                                    address: data.address,
                                    default: false,
                                    entity: data.entity
                                  }
                                ];
                              });
                            }}
                          />
                        )}
                        {plantsOpen?.open && (
                          <ManageWarehouse
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={plantsOpen?.open}
                            close={() => setPlantsOpen({ open: false, isClone: false })}
                            isClone={plantsOpen?.isClone}
                            onSuccess={({ data }) => {
                              setPlantsOpen({ open: false, isClone: false });
                              setFieldValue('transferFromPlant', data._id);

                              setPlantsCategoryOptions((prevState) => {
                                return [
                                  ...prevState,
                                  {
                                    optionValue: data._id,
                                    optionLabel: data.warehouseName,
                                    order: plantsCategoryOptions.length,
                                    address: data.address,
                                    default: false,
                                    entity: data.entity
                                  }
                                ];
                              });
                            }}
                          />
                        )}
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isFieldNotTouched(initialData, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton loading={isSubmitting} disabled={isSubmitting} variant="contained" color="primary" type="submit" onClick={submitForm}>
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

export default ManageTransferInvtransferInventory;
