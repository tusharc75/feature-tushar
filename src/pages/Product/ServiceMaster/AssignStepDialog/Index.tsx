import { Box, Button, Dialog, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';

function AssignStepDialog({ consumables, steps, loading, handleCloseDialog, onSuccess }) {
  const [selectedSteps, setSelectedSteps] = useState({});

  const handleSave = () => {
    const consumableWithSteps = [];
    consumables?.map((item) => {
      if (selectedSteps[item._id] && selectedSteps[item._id]?.length) {
        selectedSteps[item._id]?.map((step) => {
          consumableWithSteps.push({
            ...item,
            stepId: step._id,
            qty: step.qty < 1 ? 1 : step.qty
          });
        });
      } else {
        consumableWithSteps.push({
          ...item,
          qty: item?.qty < 1 ? 1 : item?.qty
        });
      }
    });
    onSuccess(consumableWithSteps);
  };

  return (
    <Dialog fullWidth maxWidth="sm" fullScreen={false} open={true} onClose={handleCloseDialog} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader title={`Assign Consumables to Step`} showManimizeMaximize={false} showRequiredLabel={true} onClose={handleCloseDialog} />
      <CustomDialogContent>
        <div className="header-panel">
          {consumables?.length &&
            consumables?.map((item, index) => {
              return (
                <Box key={index} p={2} mb={2} border={1} borderColor="grey.300">
                  <Typography variant="subtitle1">{item.productName}</Typography>
                  <Box mt={1}>
                    <Autocomplete
                      multiple
                      value={selectedSteps[item?._id]}
                      onChange={(event, newValue) => {
                        setSelectedSteps({ ...selectedSteps, [item?._id]: newValue });
                      }}
                      options={steps}
                      getOptionLabel={(option) => option.stepName}
                      renderInput={(params) => <TextField {...params} label="Step Name" margin="dense" variant="outlined" />}
                    />
                  </Box>
                  <Box mt={1}>
                    <Grid container spacing={1}>
                      {selectedSteps[item._id]?.map((step, index) => {
                        return (
                          <Grid item xs={6} key={index}>
                            <TextField
                              type="number"
                              variant="outlined"
                              size="small"
                              label={step?.stepName || ''}
                              value={step.qty ?? item?.qty}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newSteps = selectedSteps[item._id]?.map((s) => {
                                  if (s?.stepName === step?.stepName) {
                                    return {
                                      ...s,
                                      qty: Number(value) < 0 ? 1 : Number(value)
                                    };
                                  }
                                  return s;
                                });
                                setSelectedSteps({ ...selectedSteps, [item._id]: newSteps });
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Box>
              );
            })}
        </div>
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
