import { Box, Dialog, Grid2 } from "@mui/material";
import { Formik } from "formik";
import { orderBy } from "lodash";
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

const WorkOrdersCompleteStepDialog = ({ workOrders, onClose, onSuccess }) => {

  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ value: [] })
  const [services, setServices] = useState(null)
  const [products, setProducts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchWorkOrderData()
  }, [workOrders])

  const fetchWorkOrderData = () => {
    setServices(null)
    axiosInstance().get(`${workOrder.api}/service/pending-services?workOrderIds=${workOrders?.map(e => e?.workOrder)}`)
      .then(({ data: { data } }) => {
        if (data && data?.length > 0) {
          const stepsData: any = []
          data?.forEach(_data => {
            const selectedWorkOrder = workOrders?.find(e => e?.workOrder === _data?._id)
            if (_data?.services?.length > 0) {
              const filteredServices = _data?.services?.filter(e => selectedWorkOrder?.services?.some(s => s?.service === e?._id && s?.uniqueId === e?.uniqueId))
              const productServices = orderBy(filteredServices?.filter(e => e?.parentId), ['order'], ['asc']);
              const _services = orderBy(filteredServices?.filter(e => !e?.parentId), ['order'], ['asc']);
              const services = [...productServices, ..._services]
              setServices(services)
              const stepData: any = []
              services?.forEach(ele => {
                if (ele?.steps && ele?.steps?.length > 0) {
                  ele?.steps?.forEach(step => {
                    let tempInitialData: any = {};
                    const _stepData = data?.stepData?.find(e => e?.stepId === step?._id && e?.serviceId === ele?._id && e?.uniqueId === ele?.uniqueId)
                    if (_stepData) {
                      tempInitialData = getObjKeysWithValues(_stepData, step?.fields && step?.fields?.length > 0 ? step?.fields : [])
                    } else {
                      tempInitialData = getObjKeys('', step?.fields && step?.fields?.length > 0 ? step?.fields : []);
                    }
                    stepData.push({
                      serviceId: ele?._id,
                      uniqueId: ele?.uniqueId,
                      stepId: step?._id,
                      ...tempInitialData
                    })
                  });
                }
              });
              stepsData.push({
                workOrder: _data?._id,
                stepData: stepData
              })
            }
            if (_data?.products?.length) {
              setProducts(_data?.products)
            }
          });
          setInitialValues({ value: stepsData })
        }
      }).catch((err) => {
        toastConfig.setToastConfig(err);
      })
  }

  const getFields = (stepData) => {
    const service = services?.find(s => s?._id === stepData?.serviceId && s?.uniqueId === stepData?.uniqueId)
    const fields = service?.steps?.find(s => s?._id === stepData?.stepId)?.fields
    return fields && fields?.length > 0 ? fields : []
  }

  const handleSave = (values) => {
    setIsSubmitting(true)
    axiosInstance().put(`${workOrder.api}/complete-multiple-services`, values?.value)
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
    const errors: any = { value: [{ stepData: [] }] }
    values?.value?.forEach(ele => {
      ele?.stepData?.forEach((stepData, i) => {
        const fields = getFields(stepData)
        if (fields?.length > 0) {
          fields?.forEach(field => {
            if (field?.required && !stepData[field?.fieldName]) {
              if (!errors?.value[0]?.stepData[i]) {
                errors.value[0].stepData[i] = {}
              }
              errors.value[0].stepData[i][`${field?.fieldName}`] = `${field?.fieldLabel} is required`
            }
          });
        }
      });
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
                          head={<h6 className="text-base font-semibold">{`${service?.serviceName}${service?.parentId ? ` - ${products?.find(p => p?._id === service?.parentId)?.productDetail?.productName}` : ''}`}</h6>}
                          headProps={{ className: 'sticky top-0 z-[1] p-2' }}
                        >
                          <div className={`w-full space-y-2 overflow-y-auto max-[767px]:h-[calc(100vh-364px)] max-[600px]:h-[calc(100vh-368px)] p-2`}>
                            {service?.steps && service?.steps?.length > 0 && service?.steps?.map((step, stepIndex) => {
                              const index1 = values?.value?.findIndex(e => e?.workOrder === workOrders[0]?.workOrder)
                              const index2 = values?.value[index1]?.stepData?.findIndex(e => e?.serviceId === service?._id && e?.uniqueId === service?.uniqueId && e?.stepId === step?._id)
                              return (
                                <CustomCollapsible
                                  element="li"
                                  className="border"
                                  defaultExpanded
                                  head={<h6 className="text-base font-semibold">{step?.stepName}</h6>}
                                  headProps={{ className: 'sticky top-0 z-[1] p-2' }}
                                >
                                  <div>
                                    {step?.fields && step?.fields?.length > 0 && values?.value[index1]?.stepData?.[index2] ? (
                                      <div className="p-2 mt-2">
                                        <Grid2 spacing={2} container>
                                          {step?.fields?.map((field, i) => (
                                            <Grid2 key={i} size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}  >
                                              <FormTypes
                                                {...field}
                                                fieldData={field}
                                                disabled={field?.disableOnEdit}
                                                values={values?.value[index1]?.stepData?.[index2]}
                                                errors={errors?.value?.[index1]?.stepData?.[index2] ? errors?.value?.[index1]?.stepData?.[index2] : {}}
                                                touched={touched?.value?.[index1]?.stepData?.[index2] ? touched?.value?.[index1]?.stepData?.[index2] : {}}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={field.option}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(`value[${index1}].stepData[${index2}].${name}`, value)
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
                                      <div className="text-center">
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
                  <Box p={2} height={500}>
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
                  if (validate(values)?.value[0]?.stepData?.length <= 0) {
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
