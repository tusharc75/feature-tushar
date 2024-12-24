import React, { useContext, useState } from 'react';
import { Box, TextField } from '@mui/material';
import { Button, CircularProgress, Dialog } from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, serializedAsset } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  }
}));

export default function AssetScrapRepairDialog({ statusToUpdate, setStatusToUpdate, onSuccess, onClose, selectedRecords, id }) {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  return (
    <Dialog
      open
      classes={{
        paper: classes.paper
      }}
      TransitionComponent={CustomDialogTransition}
      onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
    >
      <CustomDialogHeader
        title="Are you sure ?"
        showRequiredLabel={false}
        onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
      />

      <CustomDialogContent>
        <Box className="my-2">
          {statusToUpdate.status === 'Repair' ? (
            <h4>You want to change the status of selected assets to {statusToUpdate.status} ?</h4>
          ) : (
            <TextField
              id="outlined-multiline-static"
              label={`Please enter the reason for ${statusToUpdate.status}`}
              multiline
              fullWidth
              rows={4}
              value={statusToUpdate.message}
              variant="outlined"
              onChange={(e) => {
                setStatusToUpdate((prevState) => ({ ...prevState, message: e.target.value }));
              }}
            />
          )}
        </Box>
      </CustomDialogContent>

      <CustomDialogFooter>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          size="small"
          onClick={() => {
            setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: true }));
            axiosInstance()
              .put(`${serializedAsset.api}/update-status`, {
                comment: statusToUpdate.message,
                assets: selectedRecords.map((m) => ({
                  _id: m?._id ?? m?.id,
                  currentStatus: m.status
                })),
                status: statusToUpdate.status,
                reference: {
                  _id: id,
                  type: 'Repair'
                }
              })
              .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
                setStatusToUpdate({ open: false, isUpdating: false, status: '', message: '' });
                onSuccess();
              })
              .catch((error) => {
                setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false }));
                toastConfig.setToastConfig(error);
              });
          }}
          disabled={statusToUpdate.isUpdating}
          variant="contained"
          color="primary"
        >
          {statusToUpdate.isUpdating ? <CircularProgress style={{ marginRight: '8px' }} size={20} color="inherit" /> : null}
          Change Status
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}
