import { useEffect, useState } from 'react';
import { Box, Grid, IconButton, Typography } from '@mui/material';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps from 'src/components/Steps';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import View from './View';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { STEPS_STYLE } from 'src/constants/helpers';
import { KeyboardArrowLeft } from '@mui/icons-material';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';

const Step = ({ tab, resourcePolicyId = null, workflowId = null, resourceId, resource, data, allowedToEdit, referenceData = null }) => {
  const [steps, setSteps] = useState(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [expended, setExpended] = useState({});
  const [nextStep, setNextStep] = useState(false);
  const [index, setIndex] = useState({});
  const [isExpanded, setIsExpanded] = useState(true);

  const findSteps = () => {
    setStepLoading(true);
    let api = `/dynamic-form/steps?resourcePolicyId=${resourcePolicyId}&tabId=${tab?._id}`;
    if (workflowId) api = `${routes.workflow.path}/tabs/steps/${workflowId}/${tab?._id}`;
    axiosInstance()
      .get(api)
      .then((res) => {
        const steps = res?.data?.data;
        steps?.forEach((step) => {
          step.fields = CURReplaceByCurrencySingle(step?.fields, data?.currency ? data?.currency : 'USD');
        });
        setSteps(steps);
        setStepLoading(false);
      })
      .catch((error) => {
        setStepLoading(false);
      });
  };

  useEffect(() => {
    if (tab?._id && (resourcePolicyId || workflowId)) {
      findSteps();
    }
  }, [tab, resourcePolicyId, workflowId]);

  useEffect(() => {
    if (steps?.length && tab?.stepsStyle === STEPS_STYLE.sideBar) setIndex(steps[0]);
  }, [steps]);

  const handleClick = (step) => {
    setIndex(step);
  };

  return (
    <>
      {steps && steps?.length ? (
        tab?.stepsStyle === STEPS_STYLE.step ? (
          <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            <Steps
              isNextStep={false}
              nextStep={steps[currentStep]?.stepDataRequired ? nextStep : true}
              steps={steps?.map((s) => ({ name: s?.stepName, title: s?.stepName }))}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={false}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
            />
            <View
              step={steps[currentStep]}
              allowedToEdit={allowedToEdit}
              data={data}
              resource={resource}
              resourceId={resourceId}
              setNextStep={setNextStep}
              stepFullScreen={stepFullScreen}
              referenceData={referenceData}
            />
          </ContentFullScreen>
        ) : tab?.stepsStyle === STEPS_STYLE.sideBar ? (
          <>
            <div className={`grid ${isExpanded ? 'md:grid-cols-[300px_1fr]' : 'md:grid-cols-[100px_1fr]'} gap-3 transition-[all] duration-300`}>
              <div className={`container-with-border max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden p-[20px]`}>
                <div className={`${isExpanded ? 'ml-auto' : 'mx-auto'} mb-2 max-w-fit`}>
                  <IconButton size="small" onClick={() => setIsExpanded((prev) => !prev)}>
                    <KeyboardArrowLeft
                      className="transition-all duration-300 data-[expanded=false]:[transform:rotate(180deg)]"
                      data-expanded={isExpanded}
                    />
                  </IconButton>
                </div>
                {steps?.map((step, i) => {
                  return (
                    <div
                      key={i}
                      title={step?.stepName}
                      onClick={() => handleClick(step)}
                      data-active={index === step}
                      className={`p-[18px] [border:1px_solid_var(--common-border-color)] ${
                        i === 0 ? 'rounded-t-md' : ''
                      } cursor-pointer last:rounded-b-md data-[active=true]:[border:1px_solid_var(--dark-active-border-color,#298B88)]`}
                    >
                      <div className="flex gap-2">
                        <span className="h-[20px] w-[20px] flex-shrink-0 rounded-full bg-[var(--dark-secondary,var(--primary))] text-center text-[10px] leading-[20px] text-white">
                          {i + 1}
                        </span>
                        <Typography variant="subtitle2" className={`${isExpanded ? '' : 'sr-only'} line-clamp-1 transition-all duration-300`}>
                          {step?.stepName}
                        </Typography>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`container-with-border overflow-y-auto overflow-x-hidden  p-[20px]`}>
                <View
                  step={index}
                  allowedToEdit={allowedToEdit}
                  data={data}
                  resource={resource}
                  resourceId={resourceId}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
                  referenceData={referenceData}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {steps?.map((step, i) => {
              return (
                <Box mt={2} key={i}>
                  <Accordion
                    expanded={expended[`${step?._id}`]}
                    className="accordOpportunity"
                    onChange={() => setExpended((prev) => ({ ...prev, [`${step?._id}`]: !prev[`${step?._id}`] }))}
                  >
                    <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                      <Grid container className="pos_rel">
                        <Grid item xs={8}>
                          <Box display="flex" alignItems="center">
                            <Box>
                              <IconButton size="small">{expended[`${step?._id}`] === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                            </Box>
                            <Box padding="5px">
                              <Typography variant="subtitle2">{step?.stepName}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      <>
                        {expended[`${step?._id}`] && (
                          <View
                            step={step}
                            allowedToEdit={allowedToEdit}
                            data={data}
                            resource={resource}
                            resourceId={resourceId}
                            fromAccordian={true}
                            referenceData={referenceData}
                          />
                        )}
                      </>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              );
            })}
          </>
        )
      ) : stepLoading ? (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <Box minHeight={'300px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
          Steps not added yet!
        </Box>
      )}
    </>
  );
};

export default Step;
