import React, { useEffect, useState } from 'react';
import { Grid, Box, InputAdornment } from '@material-ui/core';
import { IconButton, Tooltip } from '@material-ui/core';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import FormTypes from './FormTypes';
import { setFieldsInAscendingOrder } from '../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import { useData } from '../../StateProvider/Provider';
import ManageAddressDialog from "../../components/Address/ManageAddressDialog"

const InputField = (props) => {
  const { fieldsData, errors, touched, values, setFieldValue, onImageUploadCompletePercentage, ...rest } = props;

  const [formsData, setFormsData] = useState([]);
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressOpen, setAddressOpen] = useState({open:false, isClone: false})
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldsData));
    const addressOption = fieldsData.filter((obj) => obj?.fieldName==="address")
    setAddressOptions(addressOption[0]?.option);
    // eslint-disable-next-line
  }, [fieldsData]);

  return (
    <React.Fragment>
      {formsData &&
        formsData.map((form, i) => (
          <div key={i}>
            <div className={'detail-box-content'}>
              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
            </div>
            <Box marginY={2}>
              <Grid spacing={3} container>
                {form.sectionFields.map((field) =>
                  field.type === 'converter' || field.type === 'currencyAmount' ? (
                    <FormTypes
                      {...rest}
                      values={values}
                      errors={errors}
                      touched={touched}
                      label={field.fieldLabel}
                      name={field.fieldName}
                      type={field.type}
                      options={field.option}
                      setFieldValue={setFieldValue}
                      required={field.required}
                      isTooltip={field.isTooltip}
                      tooltipMessage={field.tooltipMessage}
                      fields={fieldsData}
                      fieldData={field}
                    />
                  ) : field.fieldName === 'address' ? (
                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                      <Grid container spacing={1}>
                        <Grid item xs={permissions?.warehouse?.isCreate ? 10 : 11} sm={permissions?.warehouse?.isCreate ? 10 : 11} md={permissions?.isCreate ? 10 : 11}>
                          <FormTypes
                            {...rest}
                            values={values}
                            errors={errors}
                            touched={touched}
                            label={field.fieldLabel}
                            name={field.fieldName}
                            type={field.type}
                            options={addressOptions}
                            setFieldValue={setFieldValue}
                            required={field.required}
                            isTooltip={field.isTooltip}
                            tooltipMessage={field.tooltipMessage}
                            fields={fieldsData}
                            fieldData={field}
                          />
                        </Grid>
                        {permissions?.warehouse?.isCreate &&(
                        <Grid item xs={1} sm={1} md={1}>
                          <Tooltip title="Add Address" className="mt-1">
                            <IconButton
                              onClick={() => {
                                setAddressOpen({ open: true, isClone: false });
                              }}
                              disabled={ field.disableOnEdit}
                              size="small"
                            >
                              <AddIcon color={'primary'} />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                        )}

                        {field?.tooltipMessage ? (
                          <Grid item xs={1} sm={1} md={1}>
                            <Tooltip title={field?.tooltipMessage ?? ''}>
                              <InfoIcon color="disabled" />
                            </Tooltip>
                          </Grid>
                        ) : null}
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid
                      key={field.fieldName}
                      item
                      xs={12}
                      sm={field.type === 'imageUpload' || field.type === 'fileUpload' ? 12 : 6}
                      md={field.type === 'imageUpload' || field.type === 'fileUpload' ? 12 : 6}
                    >
                      <FormTypes
                        {...rest}
                        startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ''}
                        values={values}
                        errors={errors}
                        touched={touched}
                        label={field.fieldLabel}
                        name={field.fieldName}
                        type={field.type}
                        options={field.option}
                        setFieldValue={setFieldValue}
                        required={field.required}
                        isTooltip={field.isTooltip}
                        tooltipMessage={field.tooltipMessage}
                        onChange={
                          field.fieldName === 'currency'
                            ? (e, val) => {
                                if (val && val.currencyCode) {
                                  setFieldValue(field.fieldName, val.currencyCode);
                                  setCurrencySymbol(val.symbolNative);
                                } else {
                                  setFieldValue(field.fieldName, '');
                                  setCurrencySymbol(null);
                                }
                              }
                            : field.type === 'dropDown'
                            ? (e, val) => {
                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');
                              }
                            : null
                        }
                        imageOrFileUploadCompletePercentage={
                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                            ? (completePercentage) => {
                                onImageUploadCompletePercentage(completePercentage);
                              }
                            : null
                        }
                        fields={fieldsData}
                        fieldData={field}
                      />
                    </Grid>
                  )
                )}
                {addressOpen?.open && (
                  <ManageAddressDialog
                  open={addressOpen?.open}
                  onClose={() => setAddressOpen({open:false,isClone:false}) }
                  onSuccess={(data) => {
                
                    setAddressOpen({open:false,isClone:false})
                    setFieldValue("address",data.brand)
                    setAddressOptions((prevState) => {
                      return [
                        ...prevState,
                        {
                          optionValue: data.brand,
                          optionLabel: data.fullAddress,
                          order: addressOptions.length,
                          default: false
                        }
                      ]
                    })
                  }}
               
                  />
                )}
              </Grid>
            </Box>
          </div>
        ))}
    </React.Fragment>
  );
};

export default InputField;
