import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import { CustomDialogTransition, workOrder } from 'src/constants/helpers';
import { Box, Dialog, TextField } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Autocomplete from '@material-ui/lab/Autocomplete/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const AssignUserDialog = ({ workOrderData, assignedUsers, reference, referenceData = null, handleClose, handleSucess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(assignedUsers);

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
    const data: any = {
      users: selectedUsers?.map((d) => d.optionValue),
    }
    let api = workOrder.api
    if (reference === 'service') {
      api = `${api}/service/assign-user`
      data.workOrder = workOrderData
    } else if (reference === 'steps') {
      api = `${api}/step/assign-user`
      data.workOrderId = workOrderData?.workOrderId;
      data.stepId = referenceData?.stepId;
      data.serviceUniqueId = referenceData?.serviceUniqueId;
    }

    axiosInstance()
      .put(api, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        handleSucess();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
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
      <CustomDialogHeader onClose={handleClose} title={`Assign Technicians`} showRequiredLabel={false} showManimizeMaximize={false} />
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
            renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="userList" label={'Select Technicians'} />}
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
          onClick={(e) => {
            e.preventDefault();
            handleAssignUser();
          }}
        >
          {' '}
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default AssignUserDialog;
