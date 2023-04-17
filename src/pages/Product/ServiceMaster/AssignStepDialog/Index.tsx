import { Box, Button, Dialog, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';

function AssignStepDialog({ consumables, steps, loading, handleCloseDialog, onSuccess }) {

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
    <Dialog
      fullWidth
      maxWidth="sm"
      fullScreen={false}
      open={true}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={`Assign Consumables to Step`}
        showManimizeMaximize={false}
        showRequiredLabel={true}
        onClose={handleCloseDialog} />
      <CustomDialogContent>
        <div className="header-panel">
          {consumables?.length &&
            consumables?.map((item, index) => {
              return (
                <Box key={index} p={2} mb={2} border={1} borderColor="grey.300">
                  <Typography variant='subtitle1'>{item.productName}</Typography>
                  <Box mt={1}>
                    <Autocomplete
                      value={steps?.find((step) => step._id === selectedSteps[item._id]) || null}
                      onChange={(event, newValue) => {
                        handleChange(item._id, newValue?._id);
                      }}
                      options={steps}
                      getOptionLabel={(option) => option.stepName}
                      renderInput={(params) => <TextField {...params} label="Step Name" margin="dense" variant="outlined" />}
                    />
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
