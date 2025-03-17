import { useState } from 'react';
import { Dialog, IconButton, TextField, InputAdornment, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from '@mui/material/Grid2';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, formatAmountWithCurrency } from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ItemizeExpenses = ({ onClose, onSave, lineItems, currency, currencySymbol, isSubmitting }) => {
  const [localLineItems, setLocalLineItems] = useState([...lineItems]);
  const [touchedFields, setTouchedFields] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleBlur = (index, field) => {
    setTouchedFields((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: true }
    }));
  };

  const isFormValid = () => {
    return localLineItems.every((field) => field.description.trim() !== '' && Number(field.amount) > 0);
  };

  const addLineItem = () => {
    setLocalLineItems([...localLineItems, { id: localLineItems.length, description: '', amount: '' }]);
  };

  const removeLineItem = (id) => {
    setLocalLineItems(localLineItems.filter((field) => field.id !== id));
  };

  const handleInputChange = (index, field, event) => {
    const newFields = [...localLineItems];
    newFields[index][field] = event.target.value;
    setLocalLineItems(newFields);
  };

  const computeTotal = () => localLineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSave = () => {
    const validItems = localLineItems.filter((field) => field.description.trim() !== '' && Number(field.amount) > 0);
    const total = computeTotal();
    onSave(validItems, total);
    onClose();
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
      open={true}
    >
      <CustomDialogHeader
        title="Itemize"
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => setFullScreen((prevState) => !prevState)}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <Box pb={2}>
          <ThemeButton startIcon={<AddIcon fontSize="small" />} onClick={addLineItem}>
            Add
          </ThemeButton>
        </Box>
        {localLineItems.map((field, index) => (
          <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center', marginBottom: 2 }}>
            <Grid size={{ xs: 8 }}>
              <TextField
                label="Description"
                size="small"
                value={field.description}
                onChange={(event) => handleInputChange(index, 'description', event)}
                onBlur={() => handleBlur(index, 'description')}
                fullWidth
                required
                error={touchedFields[index]?.description && field.description.trim() === ''}
                helperText={touchedFields[index]?.description && field.description.trim() === '' ? 'Description is required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField
                label="Amount"
                type="number"
                size="small"
                value={field.amount}
                onChange={(event) => {
                  const newValue = Number(event.target.value);
                  if (newValue >= 0 || event.target.value === '') {
                    handleInputChange(index, 'amount', event);
                  }
                }}
                onBlur={() => handleBlur(index, 'amount')}
                fullWidth
                required
                error={touchedFields[index]?.amount && Number(field.amount) <= 0}
                helperText={touchedFields[index]?.amount && Number(field.amount) <= 0 ? 'Amount is required' : ''}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 1 }}>
              <HtmlTooltip title="Remove">
                <IconButton onClick={() => removeLineItem(field.id)} aria-label="delete">
                  <DeleteIcon color="error" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </Grid>
          </Grid>
        ))}
        <div className="grid justify-end pt-3">
          <span className="font-medium">Total Amount: {formatAmountWithCurrency(currency, computeTotal())?.fullFormatAmountWithoutSpace}</span>
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" id="dialog-cancel-button" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton
          isLoading={isSubmitting}
          buttonType="theme"
          id="dialog-save-button"
          disabled={!isFormValid() || isSubmitting}
          onClick={handleSave}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ItemizeExpenses;
