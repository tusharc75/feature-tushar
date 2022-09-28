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

const AssignUserDialog = ({ workOrderData, assignedUsers, handleClose, handleSucess }) => {

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
    }

    const handleAssignUser = () => {
        axiosInstance()
            .put(`${workOrder.api}/service/assign-user`, {
                "users": selectedUsers?.map(d => d.optionValue),
                "workOrder": workOrderData
            })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data?.message,
                });
                handleSucess()
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    return (<Dialog
        maxWidth="sm"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                handleClose()
            }
        }}
    >
        <CustomDialogHeader
            onClose={handleClose}
            title={`Assign Users`}
            showRequiredLabel={false}
            showManimizeMaximize={false}
        />
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
                    renderInput={(props) => (
                        <TextField
                            {...props}
                            placeholder={''}
                            variant="outlined"
                            name="userList"
                            label={'Select Users'}
                        />
                    )}
                />
            </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleClose}
            >
                Cancel
            </Button>
            <CustomButton
                variant="contained"
                color="primary"
                type="submit"
                onClick={(e) => {
                    e.preventDefault();
                    handleAssignUser()
                }}
            > Save</CustomButton>
        </CustomDialogFooter>
    </Dialog>);
}
export default AssignUserDialog;