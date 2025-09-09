import { Box, Typography, Stepper, Step, StepLabel, Card, CardContent, Grid, Button, Chip, CircularProgress } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Formik } from 'formik';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { SVG } from 'src/assets';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';
import { sidebarResource, yupSchema } from 'src/constants/helpers';

const PublicOnboarding = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams<{ id: string }>();

  const [onboardingData, setOnboardingData] = useState(null);
  const [onboardingTemplateData, setOnboardingTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepsData, setStepsData] = useState([]);
  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { data: onboardingResponse } } = await axiosInstance().get(`${routes.onboarding.path}/public/${id}`);
      setOnboardingData(onboardingResponse);

      if (onboardingResponse.onboardingTemplateData) {
        setOnboardingTemplateData(onboardingResponse.onboardingTemplateData);
        
        const initialStepsData = onboardingResponse.onboardingTemplateData.tabs?.[0]?.steps.map(step => {
          const existingStepData = onboardingResponse.stepsData?.find(sd => sd.stepId === step._id);
          return existingStepData || {
            stepId: step._id,
            ...step.fields.reduce((acc, field) => {
              acc[field.fieldName] = onboardingResponse[field.fieldName] || '';
              return acc;
            }, {})
          };
        }) || [];
        
        setStepsData(initialStepsData);
        
        const currentStepId = onboardingResponse.onboardingTemplateData.tabs[0].steps[activeStepIndex]._id;
        const currentStepData = initialStepsData.find(step => step.stepId === currentStepId) || {};
        setInitialValues(currentStepData);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStepChange = (index: number) => {
    setActiveStepIndex(index);
    const currentStepId = onboardingTemplateData.tabs[0].steps[index]._id;
    const currentStepData = stepsData.find(step => step.stepId === currentStepId) || {};
    setInitialValues(currentStepData);
  };

  const handleSubmit = async (values) => {
    const currentStepId = onboardingTemplateData.tabs[0].steps[activeStepIndex]._id;
    
    setStepsData(prev => {
      const newStepsData = [...prev];
      const stepIndex = newStepsData.findIndex(step => step.stepId === currentStepId);
      
      if (stepIndex === -1) {
        newStepsData.push({
          stepId: currentStepId,
          ...values
        });
      } else {
        newStepsData[stepIndex] = {
          ...newStepsData[stepIndex],
          ...values
        };
      }
      return newStepsData;
    });
    handleStepChange(activeStepIndex + 1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!onboardingData || !onboardingTemplateData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Could not load onboarding information.</Typography>
      </Box>
    );
  }

  const steps = onboardingTemplateData.tabs?.[0]?.steps || [];
  const activeStepData = steps[activeStepIndex];
  const fieldsData = activeStepData?.fields || [];

  return (
    <Box className="main-container-v1" sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <img
        className={`'block'} mx-auto max-h-[33px]`}
        src={SVG('LogoNewShort')}
        alt="equip logo"
        title="eQuipt Logo"
      />
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <Typography variant="h4" component="h1" fontWeight="bold">
            {onboardingData.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {onboardingData.jobRole}
          </Typography>
        </Box>
        <Box className="controls-v1">
          <Chip 
            label={onboardingData.status} 
            color={onboardingData.status === 'Pending' ? 'warning' : 'success'} 
          />
        </Box>
      </Box>

      <Box className="detail-container-v1">
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, mb: 4 }}>
          <Stepper activeStep={activeStepIndex} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step._id}>
                <StepLabel 
                  onClick={() => handleStepChange(index)}
                  sx={{ cursor: 'pointer', '& .MuiStepLabel-label': { mt: 1 } }}
                >
                  {step.stepName}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Formik
          initialValues={initialValues}
          validationSchema={yupSchema(fieldsData)}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Form>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <InputField
                    fieldsData={fieldsData}
                    values={values}
                    errors={errors}
                    touched={touched}
                    setFieldValue={setFieldValue}
                    resource={sidebarResource.onboarding}
                    size="small"
                    fullWidth
                    referenceId={id}
                  />
                </CardContent>
              </Card>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStepIndex === 0}
                  onClick={() => handleStepChange(activeStepIndex - 1)}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={submitForm}
                >
                  {activeStepIndex === steps.length - 1 ? 'Submit' : 'Next'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default PublicOnboarding;