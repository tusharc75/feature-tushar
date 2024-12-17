import { Box, Button, Grid, IconButton } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { NewAddressOptionList } from 'src/StateProvider/AddressProvider';
import routes from 'src/components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import ManageAddressDialog from '../../../components/Address/ManageAddressDialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import FormTypes from '../../../components/Helpers/FormTypes';
import { CustomDialogTransition, setFieldsInAscendingOrder, yupSchema } from '../../../constants/helpers';
import ManageAccountDialog from './index';

const arr = [...Array(9).keys()];

export default function ManageAccount(props) {
  const {
    accountData,
    handleSubmit,
    onClose,
    open,
    isNew,
    loading,
    owners,
    collaborators,
    fromProject,
    accountId = null,
    formValues = {},
    marketSegmentId = null,
    isClone,
    accountNameForClone,
    accountResource,
    accountApi,
    handleAddressDataSource = null
  } = props;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { newAddressOptionList, setNewAddressOptionList } = React.useContext(NewAddressOptionList);
  const [formsData, setFormsData] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [parentAccountDataSource, setParentAccountDataSource] = useState([]);
  const [additionalFieldName, setAdditionalFieldName] = useState('');

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [addressDataSource, setAddressDataSource] = useState([]);
  const [showAddAddresstDialog, setShowAddAddresstDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isAccDialogVisible, setIsAccDialogVisible] = useState(false);
  const [addressType, setAddressType] = useState(null);
  const [isShippingSameAsBilling, setIsShippingSameAsBilling] = useState(false);

  const [disableOwnerSelection] = useState(!isNew && user.user._id !== accountData.initialValues.owner);

  useEffect(() => {
    if (isNew) {
      const processSteps = accountData.fields.find((d) => d.type.toLowerCase() === 'process');

      if (processSteps) {
        accountData.fields.map((d) => {
          if (d.sectionName == processSteps?.additionalInfoSection) {
            setAdditionalFieldName(d.sectionName);
          }
        });
      }
    }

    const parentAccountDropdownData = accountData.fields.find((d) => d.fieldName === 'parentAccount');
    if (parentAccountDropdownData) {
      setParentAccountDataSource(
        isNew ? parentAccountDropdownData.option : parentAccountDropdownData.option.filter((d) => d?.optionValue !== accountId)
      );
    }

    setFormsData(setFieldsInAscendingOrder(accountData.fields));

    const addressDataDropdown = accountData.fields.find((d) => d.fieldName === 'billingAddress');
    if (addressDataDropdown) {
      setAddressDataSource(addressDataDropdown.option);
    }
  }, [accountData.fields]);

  useEffect(() => {
    handleAddressDataSource(addressDataSource);
  }, [addressDataSource]);

  const onSubmit = (values, setValues) => {
    handleSubmit(values, false);
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input: any = document.querySelectorAll(`input[name=${err[0]}]`);
      input?.forEach((_i) => {
        _i.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'start'
        });
      });
    }
  };

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
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
        {accountData.fields.length > 0 ? (
          <>
            <Formik initialValues={accountData.initialValues} validationSchema={yupSchema(accountData.fields)} validateOnMount onSubmit={onSubmit}>
              {({ submitForm, values, errors, touched, setFieldValue }) => (
                <>
                  <CustomDialogHeader
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                      setFullScreen((prevState) => !prevState);
                    }}
                    showManimizeMaximize={true}
                    onClose={() => {
                      if (isEqual(accountData.initialValues, values)) {
                        onClose({});
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                    title={
                      isClone
                        ? `Clone - ${accountNameForClone}`
                        : isNew
                          ? accountResource === 'customerAccount'
                            ? `Create ${resources?.customerAccount?.titleSingular}`
                            : `Create ${resources?.supplierAccount?.titleSingular}`
                          : `Update ${accountData.initialValues.accountName ? accountData.initialValues.accountName : ''}`
                    }
                  />
                  <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate className="truncate-autocomplete">
                      {formsData &&
                        formsData
                          .filter((item) => item.name !== additionalFieldName)
                          .map((form, i) => (
                            <div key={i}>
                              <div className={'detail-box-content'}>
                                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                              </div>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field, index2) => (
                                    <Grid key={index2} item xs={12} sm={6} md={6}>
                                      {field.fieldName === 'entity' ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          disabled={!isNew && (field.disableOnEdit || values['owner'] !== user.user._id)}
                                          multiple
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onChange={(e, value) => {
                                            setFieldValue(
                                              field.fieldName,
                                              value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []
                                            );
                                            setFieldValue('owner', '');
                                            setFieldValue('collaborator', []);
                                          }}
                                        />
                                      ) : field.fieldName.includes('isShippingAddressSameAsBillingAddress') ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          disabled={!isNew && field.disableOnEdit}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onChange={(e) => {
                                            setFieldValue(field.fieldName, e.target.checked);
                                            if (isShippingSameAsBilling === false) {
                                              setIsShippingSameAsBilling(true);
                                            } else {
                                              setIsShippingSameAsBilling(false);
                                              setFieldValue('shippingAddress', []);
                                            }
                                            if (e.target.checked && values.billingAddress) {
                                              setFieldValue('shippingAddress', values.billingAddress);
                                            }
                                          }}
                                        />
                                      ) : field.fieldName === 'billingAddress' ? (
                                        <div key={field.fieldName} className="flex items-center gap-2">
                                          <Box style={{ flexGrow: 1 }}>
                                            <FormTypes
                                              isNew={isNew}
                                              {...field}
                                              disabled={!isNew && field.disableOnEdit}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={addressDataSource}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(field.fieldName, value);
                                                if (values.isShippingAddressSameAsBillingAddress === true) {
                                                  setFieldValue('shippingAddress', value ?? '');
                                                }
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                            />
                                          </Box>

                                          <HtmlTooltip title="Add Address" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setShowAddAddresstDialog(true);
                                                setAddressType({ account: accountResource, address: 'billingAddress' });
                                              }}
                                              disabled={field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                            </IconButton>
                                          </HtmlTooltip>

                                          {field?.tooltipMessage ? (
                                            <HtmlTooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </HtmlTooltip>
                                          ) : null}
                                        </div>
                                      ) : field.fieldName === 'shippingAddress' ? (
                                        <div key={field.fieldName} className="flex items-center gap-2">
                                          <div className="flex-grow">
                                            <FormTypes
                                              isNew={isNew}
                                              {...field}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={addressDataSource}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(field.fieldName, value);
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                              disabled={values.isShippingAddressSameAsBillingAddress === true || (!isNew && field.disableOnEdit)}
                                            />
                                          </div>

                                          <HtmlTooltip title="Add Address" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setShowAddAddresstDialog(true);
                                                setAddressType({ account: accountResource, address: 'shippingAddress' });
                                              }}
                                              disabled={field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                            </IconButton>
                                          </HtmlTooltip>

                                          {field?.tooltipMessage ? (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <HtmlTooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </HtmlTooltip>
                                            </Grid>
                                          ) : null}
                                        </div>
                                      ) : field.fieldName === 'parentAccount' ? (
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid item xs={permissions[accountResource]?.isCreate ? 10 : 11}>
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                disabled={!isNew && field.disableOnEdit}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={parentAccountDataSource}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(name, value);
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                              />
                                            </Grid>
                                            {permissions[accountResource]?.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <HtmlTooltip title="Add Parent Account" className="mt-1">
                                                  <IconButton
                                                    onClick={() => {
                                                      setIsAccDialogVisible(true);
                                                    }}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
                                                  </IconButton>
                                                </HtmlTooltip>
                                              </Grid>
                                            )}
                                            {field?.tooltipMessage ? (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <HtmlTooltip title={field?.tooltipMessage ?? ''}>
                                                  <InfoIcon color="disabled" />
                                                </HtmlTooltip>
                                              </Grid>
                                            ) : null}
                                          </Grid>
                                        </Grid>
                                      ) : (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          disabled={field.fieldName === 'owner' ? disableOwnerSelection : !isNew && field.disableOnEdit}
                                          values={values}
                                          fields={accountData.fields}
                                          fieldData={field}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          imageOrFileUploadCompletePercentage={
                                            ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                              ? (completePercentage) => {
                                                  setUploadingImageOrFileProgress(completePercentage);
                                                }
                                              : null
                                          }
                                        />
                                      )}
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </div>
                          ))}
                    </Form>
                    {showAddAddresstDialog && (
                      <ManageAddressDialog
                        onClose={() => {
                          setShowAddAddresstDialog(false);
                        }}
                        onSuccess={(obj) => {
                          if (obj) {
                            let tempNewOption = {
                              optionLabel: obj?.fullAddress,
                              optionValue: obj?._id,
                              order: addressDataSource.length,
                              default: false
                            };
                            setNewAddressOptionList([...newAddressOptionList, tempNewOption]);
                            setShowAddAddresstDialog(false);
                            if (obj?.isAlreadyExist === true) {
                              let tempAddress = addressDataSource.find((d) => d?.optionLabel === obj?.fullAddress);
                              setFieldValue(addressType.address, [...values[`${addressType.address}`], tempAddress?.optionValue]);
                              if (isShippingSameAsBilling === true) {
                                if (addressType.address === 'billingAddress') {
                                  setFieldValue('shippingAddress', [...values[`${addressType.address}`], tempAddress?.optionValue]);
                                } else {
                                  setFieldValue('billingAddress', [...values[`${addressType.address}`], tempAddress?.optionValue]);
                                }
                              }
                            } else {
                              setAddressDataSource((prevState) => [
                                ...prevState,
                                {
                                  default: false,
                                  optionLabel: obj?.fullAddress,
                                  optionValue: obj._id,
                                  order: addressDataSource.length + 1
                                }
                              ]);
                              setFieldValue(addressType.address, [...values[`${addressType.address}`], obj._id]);
                              if (isShippingSameAsBilling === true) {
                                if (addressType.address === 'billingAddress') {
                                  setFieldValue('shippingAddress', [...values[`${addressType.address}`], obj._id]);
                                } else {
                                  setFieldValue('billingAddress', [...values[`${addressType.address}`], obj._id]);
                                }
                              }
                            }
                          }
                        }}
                      />
                    )}
                    {isAccDialogVisible ? (
                      <ManageAccountDialog
                        open={isAccDialogVisible}
                        onClose={() => {
                          setIsAccDialogVisible(false);
                        }}
                        id={null}
                        isRedirectToDetailPage={false}
                        isGetAccountData={true}
                        onGetAddedAccount={({ data }) => {
                          if (data?._id) {
                            setFieldValue('parentAccount', data?._id);
                            setParentAccountDataSource([
                              ...parentAccountDataSource,
                              {
                                optionLabel: data?.accountName,
                                optionValue: data?._id
                              }
                            ]);
                          }
                        }}
                        accountResource={accountResource}
                        accountApi={accountApi}
                        isClone={false}
                        accountNameForClone={''}
                      />
                    ) : null}
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <Button
                      onClick={() => {
                        if (isEqual(accountData.initialValues, values)) onClose({});
                        else setShowConfirmDialog(true);
                      }}
                      variant="outlined"
                      color="primary"
                      size="small"
                    >
                      Cancel
                    </Button>
                    <CustomButton
                      variant="contained"
                      color="primary"
                      loading={loading}
                      disabled={loading || uploadingImageOrFileProgress > 0}
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
                      close={() => setShowConfirmDialog(false)}
                      onSave={() => {
                        setShowConfirmDialog(false);
                        // e.preventDefault();
                        const err = Object.keys(errors);
                        if (err.length) {
                          const input = document.querySelector(`input[name=${err[0]}]`);

                          input.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'start'
                          });
                        }
                        submitForm();
                      }}
                      onClose={() => {
                        setShowConfirmDialog(false);
                        onClose({});
                      }}
                    />
                  ) : null}
                </>
              )}
            </Formik>
          </>
        ) : (
          <CustomDialogContent isFooterPresent={false}>
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          </CustomDialogContent>
        )}
      </Dialog>
    </>
  );
}
