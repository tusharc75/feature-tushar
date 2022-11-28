import { useState, useEffect, Fragment, useContext, useRef, FC } from 'react';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import { Formik, Form } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from 'src/components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, transferInventory, setFieldsInAscendingOrder, generateUniqueIdOnly } from 'src/constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues, resourceNames } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import ManageWarehouse from '../Warehouse/ManageWarehouse';
import { FaDiceOne } from 'react-icons/fa';

const mapPlantOption = (data: any, length: number) => {
  return {
    address: data.address,
    default: false,
    entity: data.entity,
    optionLabel: data.warehouseName,
    optionValue: data._id,
    order: length
  };
};

interface Props {
  isClone?: boolean;
  transferInventoryId?: any;
  onClose?: any;
  onSuccess?: any;
  number?: string;
  refrenceType?: string;
  refrenceId?: string;
  refrenceData?: any;
  transferFromDisable?: boolean;
  transferToDisable?: boolean;
}

const ManageTransferInventory: FC<Props> = (props) => {
  const {
    state: { selectedEntity, permissions, user }
  }: any = useData();
  const { isClone = false, transferInventoryId = null, onClose, onSuccess, number = '', transferFromDisable, transferToDisable } = props;

  const toastConfig = useContext(CustomToastContext);
  const initialRender = useRef(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState(null);

  const [plantsFromOptions, setPlantsFromOptions] = useState([]);
  const [plantToOptions, setPlantToOptions] = useState([]);
  const [customerPlants, setCustomerPlants] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('');
  const [plantToOpen, setPlantToOpen] = useState(false);
  const [plantFromOpen, setPlantFromOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isCustomer, setCustomer] = useState(false);

  useEffect(() => {
    if (!user || !user?.user || !user?.user?.customerAccountId || !user?.user?.customerContactId) return;
    setCustomer(true);
    const fetchPlants = () => {
      axiosInstance()
        .get(`${routes.warehouse.path}/customer-account`)
        .then(({ data: { data } }) => {
          data = data?.map((d: any, index) => ({
            ...d,
            optionValue: d?.warehouse,
            optionLabel: d?.warehouseDetail?.warehouseName,
            address: d?.warehouseDetail?.address?.optionValue,
            entity: d?.entity,
            order: index,
            default: false
          }));
          setCustomerPlants(data);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    };

    fetchPlants();
  }, [user]);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Transfer Inventory')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        let fromOptions = data.find((obj: any) => obj?.fieldData.fieldName === 'transferFromPlant')?.fieldData?.option ?? [];
        let toOptions = data.find((obj: any) => obj?.fieldData.fieldName === 'transfertoPlant')?.fieldData?.option ?? [];

        setPlantsFromOptions(fromOptions);
        setPlantToOptions(toOptions);

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
          createValues.status = 'New';
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

  const plantFields = ['transferFromPlant', 'transfertoPlant'];

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
                              <>
                                {['transfertoPlant', 'transferFromPlant'].includes(field.fieldName) ? (
                                  <Grid key={index2} item xs={12} sm={6}>
                                    <Grid container spacing={1} alignItems="center">
                                      <Grid
                                        item
                                        xs={
                                          (plantFields.includes(field.fieldName) &&
                                            permissions?.warehouse?.isCreate &&
                                            field.fieldName === 'transferFromPlant' &&
                                            !transferFromDisable) ||
                                            (field.fieldName === 'transfertoPlant' && !transferToDisable)
                                            ? 11
                                            : 12
                                        }
                                      >
                                        <FormTypes
                                          isNew={Boolean(transferInventoryId)}
                                          {...field}
                                          disabled={
                                            (Boolean(transferInventoryId) && field.disableOnEdit) ||
                                            (field.fieldName === 'transferFromPlant' && transferFromDisable) ||
                                            (field.fieldName === 'transfertoPlant' && transferToDisable)
                                          }
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          fieldData={field}
                                          type={field.type}
                                          options={
                                            isCustomer
                                              ? customerPlants
                                              : field.fieldName === 'transfertoPlant'
                                                ? plantToOptions
                                                : field.fieldName === 'transferFromPlant'
                                                  ? plantsFromOptions
                                                  : []
                                          }
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);

                                            if (plantFields.includes(field.fieldName)) {
                                              if (name.includes('transferFromPlant') && value === values?.transfertoPlant) {
                                                setFieldValue('transfertoPlant', '');
                                              }

                                              if (name.includes('transfertoPlant') && value === values?.transferFromPlant) {
                                                setFieldValue('transferFromPlant', '');
                                              }
                                            }
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      </Grid>
                                      {((field.fieldName === 'transferFromPlant' && !transferFromDisable) ||
                                        (field.fieldName === 'transfertoPlant' && !transferToDisable)) &&
                                        plantFields.includes(field.fieldName) &&
                                        permissions?.warehouse?.isCreate && (
                                          <Grid item xs={1}>
                                            <HtmlTooltip title="Add new plant">
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  if (field.fieldName === 'transfertoPlant') {
                                                    setPlantToOpen(true);
                                                  }

                                                  if (field.fieldName === 'transferFromPlant') {
                                                    setPlantFromOpen(true);
                                                  }
                                                }}
                                              >
                                                <AddIcon fontSize="small" color={'primary'} />
                                              </IconButton>
                                            </HtmlTooltip>
                                          </Grid>
                                        )}
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <Grid key={index2} item xs={12} sm={6}>
                                    <FormTypes
                                      isNew={Boolean(transferInventoryId)}
                                      {...field}
                                      disabled={
                                        (Boolean(transferInventoryId) && field.disableOnEdit) ||
                                        field.fieldName === 'transferNumber' ||
                                        field.fieldName === 'status'
                                      }
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      fieldData={field}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                )}
                              </>
                            ))}
                          </Grid>
                        </Box>

                        {plantToOpen && (
                          <ManageWarehouse
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={plantToOpen}
                            close={() => setPlantToOpen(false)}
                            isClone={false}
                            onSuccess={({ data }) => {
                              setPlantToOpen(false);
                              setFieldValue('transfertoPlant', data._id);

                              setPlantToOptions((prevState) => {
                                const newOption = mapPlantOption(data, prevState.length);
                                return [newOption, ...prevState];
                              });
                            }}
                          />
                        )}
                        {plantFromOpen && (
                          <ManageWarehouse
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={plantFromOpen}
                            close={() => setPlantFromOpen(false)}
                            isClone={false}
                            onSuccess={({ data }) => {
                              setPlantFromOpen(false);
                              setFieldValue('transferFromPlant', data._id);

                              setPlantsFromOptions((prevState) => {
                                const newOption = mapPlantOption(data, prevState.length);
                                return [newOption, ...prevState];
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

export default ManageTransferInventory;
