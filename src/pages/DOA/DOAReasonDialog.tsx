import React, { useState } from 'react';
import { Checkbox, CircularProgress, Dialog, List, ListItem, ListItemIcon, ListItemText, TextField } from '@mui/material';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DOAReasonDialog = ({ reasonDialogOpen, handleCloseDialog, QuoteStatusChange, accepted }) => {
  const [selectedRec, setSelectedRec] = useState(null);
  const [isAssigning] = useState(false);

  const reasons = ['Price Too High', 'Price Too Low', 'Incorrect Data', 'Not Needed', 'DOA', 'Others'];
  const [value, setValue] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  return (
    <>
      {accepted === 'Rejected' ? (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={reasonDialogOpen}
          TransitionComponent={CustomDialogTransition}
          onClose={handleCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <CustomDialogHeader title={`Reason For Reject`} />
          <CustomDialogContent>
            <>
              <List style={{ padding: 0 }}>
                {reasons.map((reason) => (
                  <ListItem divider>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          e.target.checked ? setSelectedRec(reason) : setSelectedRec(null);
                        }}
                        checked={reason === selectedRec}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-${reason}`
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={reason} />
                  </ListItem>
                ))}
              </List>
              {selectedRec === 'Others' && (
                <TextField
                  id="outlined-multiline-static"
                  label="Other reasons"
                  multiline
                  value={value}
                  onChange={handleChange}
                  rows={4}
                  variant="outlined"
                />
              )}
            </>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton
              onClick={handleCloseDialog}
              buttonType='transparent'
            >
              Cancel
            </ThemeButton>
            <ThemeButton
              disabled={isAssigning}
              onClick={() => QuoteStatusChange(accepted, '', selectedRec === 'Others' ? value : selectedRec)}
              isLoading={isAssigning}
              buttonType='theme'
            >
              {isAssigning ? <CircularProgress size={22} /> : 'Save'}
            </ThemeButton>
          </CustomDialogFooter>
        </Dialog>
      ) : null}
    </>
  );
};

export default DOAReasonDialog;
