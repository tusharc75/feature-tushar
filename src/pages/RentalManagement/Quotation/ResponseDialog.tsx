import React, { useState, useContext } from 'react';
import { Dialog, List, ListItem, ListItemIcon, ListItemText, Box, Checkbox, TextField, } from '@mui/material';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, QUOTATION_STATUS, rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ReponseDialog = ({ rentalId, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const options = { Accept: QUOTATION_STATUS.acceptByCustomer, Reject: QUOTATION_STATUS.rejectByCustomer };
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value.trimStart());
  };

  const closeManualDiaog = () => {
    onClose();
    setSelectedOption(null);
    setComment('');
    setCommentError(null);
  };

  const manualSendToCustomer = () => {
    if (selectedOption) {
      setSubmitting(true);
      let dataObj: any = {
        status: options[selectedOption],
        comment: comment || ''
      };
      axiosInstance()
        .put(`${rentalManagement.api}/quotation/${rentalId}/response`, dataObj)
        .then(() => {
          setSubmitting(false);
          onSuccess();
          onClose();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      fullWidth
      TransitionComponent={CustomDialogTransition}
      maxWidth="xs"
      open
      onClose={closeManualDiaog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={`Response By Customer`} />
      <CustomDialogContent>
        <List style={{ padding: 0 }}>
          {Object.keys(options).map((option) => (
            <ListItem divider key={option}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  onChange={(e) => {
                    e.target.checked ? setSelectedOption(option) : setSelectedOption(null);
                  }}
                  checked={option === selectedOption}
                  inputProps={{
                    'aria-labelledby': `checkbox-list-label-${option}`
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={option} />
            </ListItem>
          ))}
        </List>
        {selectedOption && (
          <Box my={2}>
            <TextField
              fullWidth
              id="outlined-multiline-static"
              label="Comment"
              multiline
              value={comment}
              onChange={handleChange}
              rows={4}
              variant="outlined"
              error={Boolean(commentError)}
              helperText={Boolean(commentError) && commentError}
            />
          </Box>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>

        <ThemeButton
          buttonType='transparent'
          onClick={closeManualDiaog}
        >
          Cancel
        </ThemeButton>
        <ThemeButton
          buttonType='theme'
          disabled={!Boolean(selectedOption) || submitting}
          onClick={manualSendToCustomer}
          isLoading={submitting}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ReponseDialog;
