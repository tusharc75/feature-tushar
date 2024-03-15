import { useEffect, useState } from 'react';
import { Box, Grid, IconButton, Typography } from '@material-ui/core';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps from 'src/components/Steps';
import _ from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import View from './View';

const Step = ({ resourceData, resourceId, resource, data, allowedToEdit }) => {
  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [expended, setExpended] = useState({});
  const [nextStep, setNextStep] = useState(false);

  useEffect(() => {
    setSteps(_.sortBy(resourceData?.steps, 'order'));
  }, [resourceData]);

  return (
    <>
      {steps &&
        steps?.length &&
        (!resourceData?.showStepsInList ? (
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
