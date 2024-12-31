import React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { CustomDialogTransition, ASSET_STATUS } from '../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export default function ReasonDialog({ onClose, status, onAddReason, ...rest }) {
  const [value, setValue] = React.useState('');

  const handleChange = (event) => {
    setValue(event.target.value.trimStart());
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={'sm'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <CustomDialogHeader
        onClose={onClose}
        title={status === ASSET_STATUS.scrap ? 'Scrapping Reason' : status === ASSET_STATUS.lost ? 'Lost Reason' : 'Comment'}
      ></CustomDialogHeader>
      <CustomDialogContent>
        <Box>
          <Box pt={3} pb={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                <TextField
                  id="outlined-multiline-static"
                  label={status === ASSET_STATUS.scrap ? 'Scrapping Reason' : status === ASSET_STATUS.lost ? 'Lost Reason' : 'Comment'}
                  placeholder={status === ASSET_STATUS.scrap ? 'Scrapping Reason' : status === ASSET_STATUS.lost ? 'Lost Reason' : 'Comment'}
                  fullWidth
                  value={value}
                  required
                  onChange={handleChange}
                  variant="outlined"
                  multiline={true}
                  rows={3}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton
          disabled={!Boolean(value)}
          buttonType="theme"
          onClick={() => {
            onAddReason(value);
          }}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog >
  );
}
