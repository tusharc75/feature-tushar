import { useEffect, useState } from 'react';
import { Box, Grid, IconButton, Typography } from '@material-ui/core';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps from 'src/components/Steps';
import _ from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import View from './View';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { STEPS_STYLE } from 'src/constants/helpers';
import { KeyboardArrowLeft } from '@material-ui/icons';

const Step = ({ resourceData, resourceId, resource, data, allowedToEdit }) => {
  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [expended, setExpended] = useState({});
  const [nextStep, setNextStep] = useState(false);
  const [index, setIndex] = useState({});
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    resourceData?.steps?.forEach((step) => {
      step.fields = CURReplaceByCurrencySingle(step?.fields, data?.currency ? data?.currency : 'USD');
    });
    setSteps(_.sortBy(resourceData?.steps, 'order'));
  }, [resourceData]);

  useEffect(() => {
    if (steps?.length && resourceData?.stepsStyle === STEPS_STYLE.sideBar) setIndex(steps[0]);
  }, [steps]);

  const handleClick = (step) => {
    setIndex(step);
  };

  return (
    <>
      {steps &&
        steps?.length &&
        (resourceData?.stepsStyle === STEPS_STYLE.step ? (
          <>
            <Steps
              isNextStep={false}
              nextStep={steps[currentStep]?.stepDataRequired ? nextStep : true}
              steps={steps?.map((s) => ({ name: s?.stepName, title: s?.stepName }))}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={false}
              setStepFullScreen={() => setStepFullScreen(true)}
            />
            <ContentFullScreen title={steps[currentStep]?.stepName} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
              <View
                step={steps[currentStep]}
                allowedToEdit={allowedToEdit}
                data={data}
                resource={resource}
                resourceId={resourceId}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
              />
            </ContentFullScreen>
          </>
        ) : resourceData?.stepsStyle === STEPS_STYLE.sideBar ? (
          <>
            <div className={`grid ${isExpanded ? 'grid-cols-[300px_1fr]' : 'grid-cols-[100px_1fr]'} gap-3 transition-[all] duration-200`}>
              <div className={`overflow-x-hidden overflow-y-auto max-h-[calc(100vh-300px)] container-with-border p-[20px]`}>
                <div className={`${isExpanded ? 'ml-auto' : 'mx-auto'} mb-2 max-w-fit`}>
                  <IconButton size="small" onClick={() => setIsExpanded((prev) => !prev)}>
                    <KeyboardArrowLeft
                      className="transition-all duration-200 data-[expanded=false]:[transform:rotate(180deg)]"
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
                      className={`p-[18px] [border:1px_solid_var(--common-border-color)] first:rounded-t-md last:rounded-b-md cursor-pointer data-[active=true]:[border:1px_solid_var(--dark-active-border-color,#298B88)]`}
                    >
                      <div className="flex gap-2">
                        <span className="bg-[var(--dark-secondary,var(--primary))] text-white w-[20px] h-[20px] text-center rounded-full text-[10px] leading-[20px] flex-shrink-0">
                          {i + 1}
                        </span>
                        <Typography variant="subtitle2" className={`${isExpanded ? '' : 'sr-only'} transition-all duration-200 line-clamp-1`}>
                          {step?.stepName}
                        </Typography>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`overflow-x-hidden overflow-y-auto container-with-border max-h-[calc(100vh-300px)] p-[20px]`}>
                <View
                  step={index}
                  allowedToEdit={allowedToEdit}
                  data={data}
                  resource={resource}
                  resourceId={resourceId}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
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
                    onChange={() => setExpended({ ...expended, [`${step?._id}`]: !expended[`${step?._id}`] })}
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
                          />
                        )}
                      </>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              );
            })}
          </>
        ))}
    </>
  );
};

export default Step;
