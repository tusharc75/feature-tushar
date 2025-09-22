import { Dialog, TextField } from '@mui/material';
import { Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, MATERIAL_TYPE } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { camelCase } from 'lodash';

const ManageCostPrice = ({ onClose, onSuccess, referenceData, costPriceData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    state: { resources }
  } = useData();
  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    setValues();
  }, [costPriceData]);

  const setValues = () => {
    const data: any = {};

    referenceData?.unit?.forEach((unit) => {
      referenceData?.pricingMethod?.forEach((method) => {
        const fieldName = `${camelCase(method)}_${unit.toLowerCase()}`;
        data[fieldName] = costPriceData?.[fieldName] || 0;
      });
    });

    if (costPriceData?._id) {
      data._id = costPriceData?._id;
    }

    setInitialValues(data);
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { data } = await axiosInstance().post('/cost-price', {
        costPrice: values,
        type: referenceData?.type,
        materialId: referenceData?._id,
        ...(values?._id && { _id: values?._id })
      });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });

      onSuccess();
      setIsSubmitting(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
      setIsSubmitting(false);
    }
  };

  const getLabel = () => {
    if (referenceData?.type === MATERIAL_TYPE.product) {
      return `${resources?.product?.titleSingular} - ${referenceData?.productName} - Cost Price`;
    } else if (referenceData?.type === MATERIAL_TYPE.package) {
      return `${resources?.packages?.titleSingular} - ${referenceData?.packageName} - Cost Price`;
    } else if (referenceData?.type === MATERIAL_TYPE.service) {
      return `${resources?.serviceMaster?.titleSingular} - ${referenceData?.serviceName} - Cost Price`;
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      open={true}
    >
      <Formik initialValues={initialValues} enableReinitialize={true} onSubmit={handleSubmit}>
        {({ values, submitForm, touched, errors, setFieldValue }) => (
          <>
            <CustomDialogHeader
              title={getLabel()}
              onClose={onClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              showRequiredLabel={false}
            />
            <CustomDialogContent style={{ maxHeight: '70vh', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '60vh' }}>
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2"></th>
                      {referenceData?.pricingMethod?.map((method, index) => (
                        <th key={index} className="whitespace-nowrap border border-gray-300 px-4 py-2">
                          {method}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referenceData?.unit?.map((unit, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-gray-300 px-4 py-2 font-bold">{unit}</td>
                        {referenceData?.pricingMethod?.map((method, colIndex) => {
                          const __fieldName = `${camelCase(method)}_${unit.toLowerCase()}`;
                          return (
                            <td key={colIndex} className="border border-gray-300 px-4 py-2">
                              <TextField
                                name={__fieldName}
                                variant="outlined"
                                margin="dense"
                                size="small"
                                fullWidth
                                type="number"
                                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                style={{ margin: 0 }}
                                value={values[__fieldName]}
                                onChange={(e) => {
                                  setFieldValue(__fieldName, parseFloat(e.target.value));
                                }}
                                slotProps={{
                                  input: {
                                    inputProps: { min: 0, max: 9999999999 }
                                  }
                                }}
                                error={touched && errors && touched[__fieldName] && Boolean(errors[__fieldName])}
                                helperText={touched && errors && touched[__fieldName] && errors[__fieldName]}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton disabled={isSubmitting} buttonType="transparent" onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={isSubmitting} buttonType="theme" disabled={isSubmitting} onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageCostPrice;
