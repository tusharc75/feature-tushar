import { Button, Dialog, TextField } from '@material-ui/core';
import CustomButton from '../Helpers/CustomButton';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export const ViewDialog = ({ columns, resource, handleSucess, viewData, handleClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [name, setName] = useState(viewData?.name || '');

  const handleSubmit = () => {
    if (viewData?._id) {
      axiosInstance()
        .put(`/pdf/view?resource=${resource}`, {
          _id: viewData?._id,
          name: name,
          columns: columns?.toString()
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleSucess()
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      axiosInstance()
        .post(`/pdf/view?resource=${resource}`, {
          name: name,
          columns: columns?.toString()
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleSucess()
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  return (
    <Dialog
      maxWidth={'sm'}
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
        }
      }}
      aria-describedby="View Dialog"
    >
      <CustomDialogHeader
        title="PDF View Name"
        onClose={() => {
          handleClose()
        }}
        showRequiredLabel={true}
      />
      <CustomDialogContent>
        <TextField
          fullWidth
          autoFocus
          margin="dense"
          type="text"
          required
          label="View Name"
          name="viewName"
          variant="outlined"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          size="small"
          onClick={() => handleClose()}
          color="primary">
          Cancel
        </Button>
        <CustomButton
          disabled={name?.trim() === ''}
          variant="contained"
          color="primary"
          type="submit"
          onClick={handleSubmit}>
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
