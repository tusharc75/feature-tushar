import { useState } from 'react';
import { Dialog, IconButton, Typography, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from '@mui/material/Grid2';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const ItemizeExpenses = ({
  open,
  onClose,
  textFields,
  value,
  addTextField,
  currencySymbol,
  removeTextField,
  handleInputChange,
  fullScreen,
  setFullScreen,
  isSubmitting
}) => {
  const [touchedFields, setTouchedFields] = useState({});

  const handleBlur = (index, field) => {
    setTouchedFields((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: true }
    }));
  };

  const isFormValid = () => {
    return textFields.every((field) => field.description.trim() !== '' && field.amount > 0);
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      open={open}
    >
      <CustomDialogHeader
        title="Itemize your Expense"
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <div>
          {textFields.map((field, index) => (
            <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center', marginBottom: 2 }}>
              <Grid size={{ xs: 5 }}>
                <TextField
                  label="Description"
                  size="small"
                  value={field.description}
                  onChange={(event) => handleInputChange(index, 'description', event)}
                  onBlur={() => handleBlur(index, 'description')}
                  fullWidth
                  error={touchedFields[index]?.description && field.description.trim() === ''}
                  helperText={touchedFields[index]?.description && field.description.trim() === '' ? 'Description is required' : ''}
                />
              </Grid>
              <Grid size={{ xs: 5 }}>
                <TextField
                  label="Amount"
                  type="number"
                  size="small"
                  value={field.amount}
                  onChange={(event) => handleInputChange(index, 'amount', event)}
                  onBlur={() => handleBlur(index, 'amount')}
                  fullWidth
                  error={touchedFields[index]?.amount && field.amount <= 0}
                  helperText={touchedFields[index]?.amount && field.amount <= 0 ? 'Amount is Required' : ''}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 2 }}>
                <IconButton onClick={() => removeTextField(field.id)} aria-label="delete">
                  <DeleteIcon color="error" fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Grid container spacing={2} sx={{ alignItems: 'center', marginTop: 2 }}>
            <Grid size={{ xs: 8 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeButton onClick={addTextField} buttonType='themeBorder' sx={{marginRight: 0.5 }} aria-label="add">
                <AddIcon fontSize="small" />
                Add
              </ThemeButton>
            </Grid>
            <Grid size={{ xs: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h6">Total Amount: {currencySymbol} {value}</Typography>
            </Grid>
          </Grid>
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" id="dialog-cancel-button" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton isLoading={isSubmitting} buttonType="theme" id="dialog-save-button" disabled={!isFormValid() || isSubmitting} onClick={onClose}>
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ItemizeExpenses;
