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

const Step = ({ resourceData, resourceId, resource, data, allowedToEdit }) => {
  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [expended, setExpended] = useState({});
  const [nextStep, setNextStep] = useState(false);
  const [index, setIndex] = useState({});

  useEffect(() => {
    resourceData?.steps?.forEach((step) => {
      step.fields = CURReplaceByCurrencySingle(step?.fields, data?.currency ? data?.currency : 'USD');
    });
    setSteps(_.sortBy(resourceData?.steps, 'order'));
  }, [resourceData]);
  
  useEffect(() => {
    if(steps?.length && resourceData?.stepsStyle === STEPS_STYLE.sideBar)setIndex(steps[0]);
  },[steps]);

  const handleClick = (step) => {
    setIndex(step);
  };

  return (
    <>
      {steps && steps?.length &&
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
        ) : (resourceData?.stepsStyle === STEPS_STYLE.sideBar ? (
        <Grid>
          <Grid style={{ display: 'flex'}}>
            <Grid style={{ marginRight: '20px',border: '1px solid black', borderRadius: '10px', padding:'12px'}}
              className={`overflow-x-hidden overflow-y-auto max-h-[calc(100vh-300px)]` }>      
              {steps?.map((step, i) => {
                return (
                  <Box mt={2} key={i} onClick={() => handleClick(step)}
                    style={{border: step === index ? '1px solid blue' : '1px solid black',borderRadius: '2px',cursor: 'pointer'}}>
                    <Box padding="5px">
                      <Typography variant="subtitle2">{step?.stepName}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
            <Grid className={`overflow-x-hidden overflow-y-auto max-h-[calc(100vh-300px)]`}>
                <View
                  step={index}
                  allowedToEdit={allowedToEdit}
                  data={data}
                  resource={resource}
                  resourceId={resourceId}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
                />
            </Grid>
          </Grid>
        </Grid>)
        :
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
