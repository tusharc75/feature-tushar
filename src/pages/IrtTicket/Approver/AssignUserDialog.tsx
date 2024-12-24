import { Box, Button, Dialog, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AssignUserDialog = ({ handleClose, onSuccess, id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchUserList();
  }, []);

  const fetchUserList = () => {
    axiosInstance()
      .get(`sa-formbuilder/lookup?lookupResource=User`)
      .then(({ data: { data } }) => {
        setUserList(data['User']);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAssignUser = () => {
    let values = selectedUsers?.map((i) => {
      return { user: i?.optionValue };
    });
    let body = { approver: values };
    axiosInstance()
      .post(`${routes?.irtTicket?.path}/approver/${id}`, body)
      .then(({ data }) => {
        handleClose();
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Added Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
    >
      <CustomDialogHeader onClose={handleClose} title={`Add Approver`} showRequiredLabel={false} showManimizeMaximize={false} />
      <CustomDialogContent>
        <Box m={1}>
          <Autocomplete
            size="small"
            options={userList}
            multiple
            value={selectedUsers}
            onChange={(_, val) => {
              setSelectedUsers(val);
            }}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
            renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="userList" label={'Select Approvers'} />}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={handleClose}>
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          color="primary"
          type="submit"
          disabled={selectedUsers?.length > 0 ? false : true}
          onClick={(e) => {
            e.preventDefault();
            handleAssignUser();
          }}
        >
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignUserDialog;
