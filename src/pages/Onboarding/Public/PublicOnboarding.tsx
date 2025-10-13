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
  const [canComplete, setCanComplete] = useState(false);

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
      setCanComplete(onboardingResponse.canComplete || false);

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

      const existingId = stepIndex !== -1 ? updatedStepsData[stepIndex]._id : undefined;

      const newStepData = {
        ...(stepIndex !== -1 ? updatedStepsData[stepIndex] : {}),
        ...values,
        stepId: currentStepId,
        ...(existingId && { _id: existingId })
      };

      if (stepIndex === -1) {
        updatedStepsData.push(newStepData);
      } else {
        updatedStepsData[stepIndex] = newStepData;
      }

      setStepsData(updatedStepsData);

      const submitData = {
        ...onboardingData,
        stepsData: updatedStepsData
      };
      const { data } = await axiosInstance().put(`${routes.onboarding.path}/public/${id}`, submitData);
      setCanComplete(data.data.canComplete || false);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
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

  const handleFinalSubmit = async () => {
    try {
      const submitData = {
        ...onboardingData,
        stepsData: stepsData,
        status: 'Completed'
      };
      
      await axiosInstance().put(`${routes.onboarding.path}/public/${id}`, submitData);
      
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Submitted successfully!'
      });
      
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
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
  const isCompleted = onboardingData?.status === 'Completed';

  const modifiedFieldsData = isCurrentStepEditable && onboardingData.status !== 'Completed'
    ? fieldsData
    : fieldsData.map(field => ({
      ...field,
      isUneditable: true,
      disableOnEdit: true
    }));

  const hasStepData = (stepData) => {
    if (!stepData) return false;

    const dataFields = { ...stepData };
    delete dataFields.stepId;
    delete dataFields._id;
    
    return Object.values(dataFields).some(value => 
      value !== '' && value !== null && value !== undefined
    );
  };

  const isStepCompleted = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return false;
    
    const stepData = stepsData.find(sd => sd.stepId === step._id);
    if (!stepData) return false;
    
    if (editableSteps[stepIndex]) {
      const stepFields = step.fields || [];
      return stepFields.every(field => {
        const value = stepData[field.fieldName];
        return value !== '' && value !== null && value !== undefined;
      });
    }
    return true;
  };

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
              {onboardingData?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {onboardingData?.jobRole}
            </Typography>
          </Box>
          {canComplete && !isCompleted && (
            <ThemeButton
              onClick={() => {
                if (window.confirm('Are you sure you want to submit? Once submitted, you cannot make changes.')) {
                  handleFinalSubmit();
                }
              }}
              buttonType="themeBorder"
            >
              Submit
            </ThemeButton>
          )}
        </Box>

        <Box className="detail-container-v1">
          <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 2 }}>
            <Stepper activeStep={activeStepIndex} alternativeLabel>
              {steps.map((step, index) => {
                const completed = isStepCompleted(index);
                return (
                  <Step key={step._id} completed={completed}>
                    <StepLabel
                      onClick={() => handleStepChange(index)}
                      sx={{ cursor: 'pointer', '& .MuiStepLabel-label': { mt: 1 } }}
                      StepIconProps={{
                        sx: {
                          color: completed ? 'success.main' : 
                                editableSteps[index] ? 'primary.main' : 'grey.500',
                          '&.Mui-completed': {
                            color: 'success.main',
                          },
                          '&.Mui-active': {
                            color: editableSteps[index] ? 'primary.main' : 'grey.500',
                          }
                        }
                      }}
                    >
                      {step.stepName}
                      {!editableSteps[index] && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          (Read-only)
                        </Typography>
                      )}
                      {isCompleted && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          (Completed)
                        </Typography>
                      )}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
          <Formik
            initialValues={initialValues}
            validationSchema={yupSchema(fieldsData)}
            onSubmit={handleSaveAndNext}
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
                  {activeStepIndex > 0 && (
                    <ThemeButton
                      onClick={() => handleStepChange(activeStepIndex - 1)}
                      disabled={activeStepIndex === 0}
                      buttonType="theme"
                    >
                      Back
                    </ThemeButton>
                  )}
                  {activeStepIndex === 0 && <Box />}

                  <Stack direction="row" spacing={2}>
                    {isCurrentStepEditable && !isCompleted && (
                      <ThemeButton
                        onClick={() => saveCurrentStep(values)}
                        disabled={saving || !isValid}
                        buttonType="themeBorder"
                        isLoading={saving}
                      >
                        {hasStepData(stepsData.find(step => step.stepId === activeStepData._id)) ? 'Update' : 'Save'}
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

                    {isCurrentStepEditable && !isLastStep && !isCompleted && (
                      <ThemeButton
                        onClick={submitForm}
                        disabled={saving || !isValid}
                        buttonType="themeBorder"
                        isLoading={saving}
                      >
                        Save & Next
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