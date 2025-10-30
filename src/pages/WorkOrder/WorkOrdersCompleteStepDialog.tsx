import { Box, Dialog, Grid2 } from "@mui/material";
import { Formik } from "formik";
import { orderBy, uniqueId } from "lodash";
import { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomDialogTransition, getObjKeys, getObjKeysWithValues, workOrder } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import FormTypes from "src/components/Helpers/FormTypes";
import { isMobile, isTablet } from "react-device-detect";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { ThemeButton } from "src/components/Helpers/Buttons";
import CustomCollapsible from "src/components/CustomCollapsible";
import { getValueOfMatchedFieldName } from "src/pages/WorkOrder/Service/Steps";

const WorkOrdersCompleteStepDialog = ({ workOrders, onClose, onSuccess }) => {

  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ value: [] })
  const [services, setServices] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [servicesWithWorkOrder, setServicesWithWorkOrder] = useState(null)

  useEffect(() => {
    fetchWorkOrderData()
  }, [workOrders])

  const fetchWorkOrderData = () => {
    setServices(null)
    axiosInstance().get(`${workOrder.api}/service/pending-services?workOrderIds=${workOrders?.map(w => w?.workOrder)}`)
      .then(({ data: { data: { workOrders: workOrdersData, services: commonServices, products, stepData } } }) => {
        if (commonServices && commonServices?.length > 0) {
          setServicesWithWorkOrder(workOrdersData)
          const workOrderServices = workOrders?.find(w => w?.workOrder === workOrdersData[0]?._id)?.services;
          const filteredServices = commonServices?.filter(e => workOrderServices?.some(s => s?.service === e?._id && s?.uniqueId === e?.uniqueId))
          const preServices = orderBy(filteredServices?.filter(e => !e?.parentId && e?.preWork), ['order'], ['asc']);
          const productServices = orderBy(filteredServices?.filter(e => e?.parentId), ['order'], ['asc']);
          const postServices = orderBy(filteredServices?.filter(e => !e?.parentId && !e?.preWork), ['order'], ['asc']);
          const services = [...preServices, ...productServices, ...postServices]
          setServices(services)
          const stepsData: any = []
          services?.forEach(ele => {
            if (ele?.steps && ele?.steps?.length > 0) {
              ele?.steps?.forEach(step => {
                let tempInitialData: any = {};
                const _stepData = stepData?.find(e => e?.stepId === step?._id && e?.serviceId === ele?._id && e?.uniqueId === ele?.uniqueId)
                let isDataAlreadyAdded = false;
                const fieldNames = step?.fields?.map((e) => e.fieldName);
                for (var key in _stepData) {
                  if (fieldNames?.includes(key)) {
                    isDataAlreadyAdded = true;
                  }
                }
                if (isDataAlreadyAdded) {
                  tempInitialData = getObjKeysWithValues(_stepData, step?.fields && step?.fields?.length > 0 ? step?.fields : [])
                } else {
                  const productData = products?.find((p) => p?._id === ele?.parentId)?.productDetail || null;
                  tempInitialData = {
                    ...getObjKeys('', step?.fields && step?.fields?.length > 0 ? step?.fields : []),
                    ...getValueOfMatchedFieldName(step?.fields, productData, {}, products)
                  };
                }
                const uniqueIds: any = [ele?.uniqueId]
                const [_, ...rest] = workOrdersData;
                rest?.map(r => {
                  r?.services?.map(s => {
                    if (s?._id === ele?._id) {
                      uniqueIds.push(s?.uniqueId)
                    }
                  })
                })
                stepsData.push({
                  serviceId: ele?._id,
                  stepId: step?._id,
                  uniqueIds,
                  ...tempInitialData
                })
              });
            }
          });
          setInitialValues({ value: stepsData })
        }
      }).catch((err) => {
        toastConfig.setToastConfig(err);
      })
  }

  const getFields = (stepData) => {
    const service = services?.find(s => s?._id === stepData?.serviceId && stepData?.uniqueIds?.includes(s?.uniqueId))
    const fields = service?.steps?.find(s => s?._id === stepData?.stepId)?.fields
    return fields && fields?.length > 0 ? fields : []
  }

  const handleSave = (values) => {
    setIsSubmitting(true)
    const data: any = []
    servicesWithWorkOrder?.forEach(ele => {
      const obj: any = { workOrder: ele?._id, stepData: [] }
      ele?.services?.forEach(e => {
        e?.steps.forEach(step => {
          const stepData = values?.value?.find(v => v?.serviceId === e?._id && v?.uniqueIds?.includes(e?.uniqueId) && v?.stepId === step?._id)
          if (stepData) {
            const { uniqueIds, ...rest } = stepData
            obj.stepData.push({ ...rest, uniqueId: e?.uniqueId })
          }
        });
      });
      data.push(obj)
    });
    axiosInstance().put(`${workOrder.api}/complete-multiple-services`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setIsSubmitting(false)
        onSuccess()
      }).catch((err) => {
        setIsSubmitting(false)
        toastConfig.setToastConfig(err);
      })
  }

  const validate = (values) => {
    const errors: any = { value: [] }
    values?.value?.forEach((ele, i) => {
      const fields = getFields(ele)
      if (fields?.length > 0) {
        fields?.forEach(field => {
          if (field?.required && !ele[field?.fieldName]) {
            if (!errors?.value[i]) {
              errors.value[i] = {}
            }
            errors.value[i][`${field?.fieldName}`] = `${field?.fieldLabel} is required`
          }
        });
      }
    });
    return errors
  }

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={fullScreen}
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <CustomDialogHeader
        title={`Complete Services`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <Formik initialValues={initialValues} validate={validate} onSubmit={handleSave} enableReinitialize>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogContent>
              <div>
                {services && services?.length > 0 ? (
                  <div className={`w-full space-y-2 overflow-y-auto max-[767px]:h-[calc(100vh-364px)] max-[600px]:h-[calc(100vh-368px)]`}>
                    {services?.map((service) => {
                      return (
                        <CustomCollapsible
                          element="li"
                          className="border"
                          defaultExpanded
                          head={<h6 className="text-base font-semibold">{`${service?.serviceName}${service?.parentProduct ? ` (${service?.parentProduct?.productName})` : ''}`}</h6>}
                          headProps={{ className: 'sticky top-0 z-[1]' }}
                        >
                          <div className={`w-full space-y-2 overflow-y-auto max-[767px]:h-[calc(100vh-364px)] max-[600px]:h-[calc(100vh-368px)] p-2`}>
                            {service?.steps && service?.steps?.length > 0 && service?.steps?.map((step) => {
                              const index = values?.value?.findIndex(v => v?.serviceId === service?._id && v?.stepId === step?._id && v?.uniqueIds?.includes(service?.uniqueId))
                              return (
                                <CustomCollapsible
                                  element="li"
                                  className="border"
                                  defaultExpanded
                                  head={<h6 className="text-base font-semibold">{step?.stepName}</h6>}
                                  headProps={{ className: 'sticky top-0 z-[1] p-2' }}
                                >
                                  <div>
                                    {step?.fields && step?.fields?.length > 0 && values?.value[index] ? (
                                      <div className="p-2 mt-2">
                                        <Grid2 spacing={2} container>
                                          {step?.fields?.map((field, i) => (
                                            <Grid2 key={i} size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}  >
                                              <FormTypes
                                                {...field}
                                                fieldData={field}
                                                disabled={field?.disableOnEdit}
                                                values={values?.value[index]}
                                                errors={errors?.value?.[index] ? errors?.value?.[index] : {}}
                                                touched={touched?.value?.[index] ? touched?.value?.[index] : {}}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={field.option}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(`value[${index}].${name}`, value)
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                                imageOrFileUploadCompletePercentage={null}
                                                fields={step?.fields}
                                              />
                                            </Grid2>
                                          ))}
                                        </Grid2>
                                      </div>
                                    ) : (
                                      <div className="text-center p-2">
                                        No Fields
                                      </div>
                                    )}
                                  </div>
                                </CustomCollapsible>
                              )
                            })}
                          </div>
                        </CustomCollapsible>
                      )
                    })}
                  </div>
                ) : (
                  <Box height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </div>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton
                disabled={isSubmitting}
                isLoading={isSubmitting}
                buttonType="theme"
                onClick={() => {
                  if (validate(values)?.value?.length <= 0) {
                    handleSave(values)
                  } else {
                    submitForm()
                  }
                }}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  )
}

export default WorkOrdersCompleteStepDialog;
