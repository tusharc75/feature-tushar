import { Box, Typography, Stepper, Step, StepLabel, Card, CardContent, Grid, Chip, CircularProgress, AppBar, Toolbar, Stack } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Formik } from 'formik';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { SVG } from 'src/assets';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';
import { sidebarResource, yupSchema } from 'src/constants/helpers';
import { useScrollDirection } from 'src/hooks/useScroll';
import styles from 'src/components/Header/Header.module.scss';
import ThemeButton from 'src/components/Helpers/Buttons/ThemeButton';

const PublicOnboarding = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams<{ id: string }>();
  const scrollPos = useScrollDirection(40);

  const [onboardingData, setOnboardingData] = useState(null);
  const [onboardingTemplateData, setOnboardingTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepsData, setStepsData] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editableSteps, setEditableSteps] = useState([]);
  const [saving, setSaving] = useState(false);

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
        
        const editableStepsArray = onboardingResponse.onboardingTemplateData.tabs?.[0]?.steps.map(
          step => step.properties?.filledByCandidate === true
        ) || [];
        setEditableSteps(editableStepsArray);

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

  const saveCurrentStep = async (values) => {
    setSaving(true);
    try {
      const currentStepId = onboardingTemplateData.tabs[0].steps[activeStepIndex]._id;
      
      let updatedStepsData = [...stepsData];
      const stepIndex = updatedStepsData.findIndex(step => step.stepId === currentStepId);
      
      const newStepData = {
        ...(stepIndex !== -1 ? updatedStepsData[stepIndex] : {}),
        ...values,
        stepId: currentStepId,
      };

      if (stepIndex === -1) {
        updatedStepsData.push(newStepData);
      } else {
        updatedStepsData[stepIndex] = newStepData;
      }
      
      setStepsData(updatedStepsData);

      // Save to database
      const submitData = {
        ...onboardingData,
        stepsData: updatedStepsData
      };
      await axiosInstance().put(`${routes.onboarding.path}/public/${id}`, submitData);
      
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Progress saved successfully!'
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async (values) => {
    await saveCurrentStep(values);
    if (activeStepIndex < onboardingTemplateData.tabs[0].steps.length - 1) {
      handleStepChange(activeStepIndex + 1);
    }
  };

  const handleFinalSubmit = async (values) => {
    await saveCurrentStep(values);
    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: 'Onboarding submitted successfully!'
    });
  };

  const handleNextWithoutSave = () => {
    if (activeStepIndex < onboardingTemplateData.tabs[0].steps.length - 1) {
      handleStepChange(activeStepIndex + 1);
    }
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
  const isCurrentStepEditable = editableSteps[activeStepIndex];
  const isLastStep = activeStepIndex === steps.length - 1;

  const modifiedFieldsData = isCurrentStepEditable
    ? fieldsData
    : fieldsData.map(field => ({
      ...field,
      isUneditable: true,
      disableOnEdit: true
    }));

  return (
    <Box className="main-container-v1" sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ 
          backgroundColor: 'white', 
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
        className={` ${scrollPos?.scrolled ? styles.fixedAppBar : ''} ${styles.toolbar}  border-b `}
        style={{ zIndex: 1200 }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          <img
            src={SVG('LogoNewShort')}
            alt="equipt logo"
            title="eQuipt Logo"
            style={{ height: '33px' }}
          />
        </Toolbar>
      </AppBar>
      <Box sx={{ pt: '80px', p: { xs: 2, md: 4 } }}>
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <Typography sx={{ fontSize: '1.7rem' }} fontWeight="bold">
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
                    StepIconProps={{
                      sx: {
                        color: editableSteps[index] ? 'primary.main' : 'grey.500',
                      }
                    }}
                  >
                    {step.stepName}
                    {!editableSteps[index] && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        (Read-only)
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Formik
            initialValues={initialValues}
            validationSchema={yupSchema(fieldsData)}
            onSubmit={isLastStep ? handleFinalSubmit : handleSaveAndNext}
            enableReinitialize
          >
            {({ values, errors, touched, setFieldValue, submitForm, isValid, dirty }) => (
              <Form>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <InputField
                      fieldsData={modifiedFieldsData}
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
                  <ThemeButton
                    onClick={() => handleStepChange(activeStepIndex - 1)}
                    disabled={activeStepIndex === 0}
                    buttonType="theme"
                  >
                    Back
                  </ThemeButton>
                  
                  <Stack direction="row" spacing={2}>
                    {isCurrentStepEditable && (
                      <ThemeButton
                        onClick={() => saveCurrentStep(values)}
                        disabled={saving || !isValid}
                        buttonType="theme"
                        isLoading={saving}
                      >
                        Save
                      </ThemeButton>
                    )}
                    
                    {!isLastStep && (
                      <ThemeButton
                        onClick={handleNextWithoutSave}
                        buttonType="theme"
                      >
                        Next
                      </ThemeButton>
                    )}
                    
                    {isCurrentStepEditable && (
                      <ThemeButton
                        onClick={submitForm}
                        disabled={saving || !isValid}
                        buttonType="theme"
                        isLoading={saving}
                      >
                        {isLastStep ? 'Submit' : 'Save & Next'}
                      </ThemeButton>
                    )}
                    
                    {!isCurrentStepEditable && isLastStep && (
                      <ThemeButton
                        onClick={submitForm}
                        buttonType="theme"
                      >
                        Submit
                      </ThemeButton>
                    )}
                  </Stack>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </Box>
  );
};

export default PublicOnboarding;