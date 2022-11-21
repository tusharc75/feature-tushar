import { useState } from 'react';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { Dialog, TextField, Button } from '@material-ui/core';

const QuantityDialog = ({ onClose, onSave }) => {
  const [newQty, setNewQty] = useState(0);
  return (
    <Dialog open maxWidth="sm" fullWidth onClose={onClose}>
      <CustomDialogHeader title={'Edit Quantity'} onClose={onClose} />
      <CustomDialogContent>
        <TextField
          fullWidth
          variant="outlined"
          label="New Quantity"
          size="small"
          type="number"
          value={newQty}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val < 0) return;
            setNewQty(val);
          }}
        />
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          type="button"
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button type="button" variant="contained" color="primary" size="small" disabled={newQty === 0} onClick={() => onSave(newQty)}>
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default QuantityDialog;
