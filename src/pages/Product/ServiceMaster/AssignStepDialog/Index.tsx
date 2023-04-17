import { Box, Button, Dialog, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';

function AssignStepDialog({ open, consumables, steps, loading, handleCloseDialog, onSuccess }) {
  const [selectedSteps, setSelectedSteps] = useState({});

  const handleChange = (productId, stepId) => {
    setSelectedSteps((prevSelectedSteps) => ({
      ...prevSelectedSteps,
      [productId]: stepId
    }));
  };

  const handleSave = () => {
    const data = consumables?.map((item) => {
      return {
        ...item,
        stepId: selectedSteps[item._id]
      };
    });
    onSuccess(data);
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={false} open={open} onClose={handleCloseDialog} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader title={`Assign steps to Consumables`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleCloseDialog} />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container spacing={2}>
            {consumables?.length &&
              consumables?.map((item, index) => {
                return (
                  <Grid item xs={12} sm={6} md={6} lg={6} key={index}>
                    <FormControl key={item._id} component="fieldset" style={{ marginBottom: '2rem' }}>
                      <FormLabel component="legend" style={{ fontWeight: 'bold' }}>
                        {item.productName}
                      </FormLabel>
                      <Autocomplete
                        value={steps?.find((step) => step._id === selectedSteps[item._id]) || null}
                        onChange={(event, newValue) => {
                          console.log(newValue);
                          handleChange(item._id, newValue?._id);
                        }}
                        options={steps}
                        getOptionLabel={(option) => option.stepName}
                        renderInput={(params) => <TextField {...params} label="Select Step" margin="dense" variant="outlined" />}
                      />
                    </FormControl>
                  </Grid>
                );
              })}
          </Grid>
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button type="button" variant="outlined" color="primary" size="small" onClick={handleCloseDialog}>
          Cancel
        </Button>
        <CustomButton
          // loading={loading}
          variant="contained"
          color="primary"
          disabled={Object.keys(selectedSteps).length !== consumables?.length}
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
