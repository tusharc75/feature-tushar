import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import { CustomDialogTransition, workOrder } from 'src/constants/helpers';
import { Box, Dialog, TextField, Typography } from '@mui/material';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Autocomplete from '@mui/material/Autocomplete/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isArray } from 'lodash';

const AssignUserDialog = ({ workOrderData, assignedUsers, reference, referenceData = null, competencies, handleClose, handleSucess, warehouse }) => {
  const toastConfig = useContext(CustomToastContext);
  const [userList, setUserList] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(assignedUsers);

  useEffect(() => {
    fetchUserList();
  }, []);

  const fetchUserList = () => {
    var api = `${workOrder.api}/technician-users?warehouse=${warehouse}`;
    if (competencies && isArray(competencies) && competencies?.length) {
      api = api + `&competencies=${JSON.stringify(competencies)}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        setUserList(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAssignUser = () => {
    const data: any = {
      users: selectedUsers?.map((d) => d.optionValue)
    };
    let api = workOrder.api;
    if (reference === 'service') {
      api = `${api}/service/assign-user`;
      data.workOrder = workOrderData;
    } else if (reference === 'steps') {
      api = `${api}/step/assign-user`;
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
          {userList ? (
            <>
              {userList?.length === 0 && (
                <Box mb={2}>
                  <Typography>None of the technicians have selected competencies.</Typography>
                </Box>
              )}
              <Autocomplete
                size="small"
                options={userList}
                multiple
                value={selectedUsers}
                onChange={(_, val) => {
                  setSelectedUsers(val);
                }}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="userList" label={'Select Technicians'} />}
              />
            </>
          ) : null}
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
