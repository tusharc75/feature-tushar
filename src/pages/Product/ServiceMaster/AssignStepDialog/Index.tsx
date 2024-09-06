import { Box, Button, Dialog, Grid, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';

function AssignStepDialog({ consumables, steps, loading, handleCloseDialog, onSuccess }) {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedSteps, setSelectedSteps] = useState({});

  const handleSave = () => {
    const consumableWithSteps = [];
    consumables?.map((item) => {
      if (selectedSteps[item._id] && selectedSteps[item._id]?.length) {
        selectedSteps[item._id]?.map((step) => {
          consumableWithSteps.push({
            ...item,
            stepId: step._id,
            qty: !step.qty ? 1 : step.qty
          });
        });
      } else {
        consumableWithSteps.push({
          ...item,
          qty: !item?.qty ? 1 : item?.qty
        });
      }
    });
    onSuccess(consumableWithSteps);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      TransitionComponent={CustomDialogTransition}
      fullScreen={fullScreen}
      open={true}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={`Assign Consumables to Step`}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={true}
        onClose={handleCloseDialog}
      />
      <CustomDialogContent>
        <Box pb={2} pt={1}>
          <Typography variant="subtitle2"> Please select the step if you intend to assign the consumables at the step level.</Typography>
        </Box>
        {consumables?.length &&
          consumables?.map((item, index) => {
            return (
              <Box key={index} p={2} mb={2} border={1} borderColor="var(--common-border-color)">
                <Typography variant="subtitle1">{item.productName}</Typography>
                <Box mt={1}>
                  <Autocomplete
                    multiple
                    value={selectedSteps[item?._id]}
                    onChange={(event, newValue: any) => {
                      newValue = newValue?.map((step) => {
                        return {
                          ...step,
                          qty: item?.qty || 1
                        };
                      });
                      setSelectedSteps({ ...selectedSteps, [item?._id]: newValue });
                    }}
                    options={steps}
                    getOptionLabel={(option) => option.stepName}
                    renderInput={(params) => <TextField {...params} label="Step Name" margin="dense" variant="outlined" />}
                  />
                </Box>
                <Box mt={2}>
                  <Grid container spacing={2}>
                    {selectedSteps[item._id]?.map((step, index) => {
                      return (
                        <Grid item xs={6} key={index}>
                          <Box>
                            <TextField
                              margin="dense"
                              type="number"
                              required
                              fullWidth
                              variant="outlined"
                              label={`Qty - ${step?.stepName}`}
                              placeholder={`Qty - ${step?.stepName}`}
                              name={`${index}_${step?.stepName}`}
                              value={step.qty}
                              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newSteps = selectedSteps[item._id]?.map((s) => {
                                  if (s?.stepName === step?.stepName) {
                                    return {
                                      ...s,
                                      qty: !Number(value) ? 1 : Number(value)
                                    };
                                  }
                                  return s;
                                });
                                setSelectedSteps({ ...selectedSteps, [item._id]: newSteps });
                              }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Box>
            );
          })}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button type="button" variant="outlined" color="primary" size="small" onClick={handleCloseDialog}>
          Cancel
        </Button>
        <CustomButton
          loading={loading}
          variant="contained"
          color="primary"
          //disabled={Object.keys(selectedSteps).length !== consumables?.length}
          onClick={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default AssignStepDialog;
