import { Button, Dialog, TextField } from '@material-ui/core';
import CustomButton from '../Helpers/CustomButton';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export const ViewDialog = ({columns, resource, referenceId, showSaveViewDialog, setShowSaveViewDialog, fetchUserViews, setViews}) => {
  const toastConfig = useContext(CustomToastContext);

  const [newViewName, setNewViewName] = useState('');

  useEffect(() => {
    if (showSaveViewDialog.data) {
      setNewViewName(showSaveViewDialog.data.name);
    } else {
      setNewViewName('');
    }
  }, [showSaveViewDialog.data]);

  const handleSaveView = () => {
    const visibleColumnsString = columns.join(', ');
    if (showSaveViewDialog.data) {
      axiosInstance()
        .put(`/pdf/${referenceId}/view?resource=${resource}`, {
          _id: showSaveViewDialog.data._id,
          name: newViewName,
          columns: visibleColumnsString
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
          fetchUserViews();
          setShowSaveViewDialog({ open: false, data: null });
          setNewViewName('');
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      axiosInstance()
        .post(`/pdf/${referenceId}/view?resource=${resource}`, {
          name: newViewName,
          columns: visibleColumnsString
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
          setViews((prevViews) => [...prevViews, data?.data?.ops[0]]);
          setShowSaveViewDialog({ open: false, data: null });
          setNewViewName('');
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  return (
    <Dialog
      maxWidth={'sm'}
      open={showSaveViewDialog.open}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowSaveViewDialog({open: false, data: null});
        }
      }}
      aria-describedby="View Dialog"
    >
      <CustomDialogHeader
        title="View"
        onClose={() => {
          setShowSaveViewDialog({open: false, data: null});
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
          value={newViewName}
          onChange={(e) => {
            setNewViewName(e.target.value);
          }}
        />
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" onClick={() => setShowSaveViewDialog({open: false, data: null})} color="primary">
          Cancel
        </Button>
        <CustomButton disabled={newViewName === ''} variant="contained" color="primary" type="submit" onClick={handleSaveView}>
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
