import { Checkbox, CircularProgress, FormControl, FormControlLabel, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { roleTypes } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import Loader from '../Loader';
import { ListingPageHeader } from '../PageHeaders';

const AssignRolesDialog = ({ rolesDialogOpen, onSuccess, handleCloseDialog, userIds, assignedRoles, isRenderedFromUserSetUp = false }) => {
  const toastConfig = useContext(CustomToastContext);
  const [roles, setRoles] = useState([]);
  const [rolesConst, setRolesConst] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const globalRole = roleTypes.filter((obj) => obj.key === 'Global')[0].value;
  useEffect(() => {
    setLoadingRoles(true);
    axiosInstance()
      .get(`/role`)
      .then(({ data: { data } }) => {
        if (assignedRoles) {
          setRoles(
            data
              .filter((role) => role?.type === globalRole && !assignedRoles.some((item) => item?._id === role?._id))
              .map((obj) => ({ ...obj, isChecked: false }))
          );
          setRolesConst(
            data
              .filter((role) => role?.type === globalRole && !assignedRoles.some((item) => item?._id === role?._id))
              .map((obj) => ({ ...obj, isChecked: false }))
          );
        } else {
          setRoles(data.filter((role) => role?.type === globalRole).map((obj) => ({ ...obj, isChecked: false })));
          setRolesConst(data.filter((role) => role?.type === globalRole).map((obj) => ({ ...obj, isChecked: false })));
        }
        setLoadingRoles(false);
      })
      .catch((error) => {
        setLoadingRoles(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAssignRoles = async () => {
    if (selectedRoles.length) {
      setAssigning(true);

      const dataObj = {
        users: userIds,
        roles: selectedRoles
      };

      await axiosInstance()
        .put(`/user/assign-role`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: 'Roles assigned successfully',
            type: 'success',
            open: true
          });

          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = rolesConst.filter((data) => {
      return data.name.toLowerCase().search(value.toLowerCase()) !== -1 || data.description.toLowerCase().search(value.toLowerCase()) !== -1;
    });
    setRoles(result);
  };

  const leftSideContents = () => {
    return (
      <>
        <FormControl component="fieldset">
          <FormControlLabel
            value="top"
            className="m-0"
            control={
              <Checkbox
                // edge="start"
                onChange={(e) => {
                  roles.forEach((data) => (data.isChecked = e.target.checked));
                  setSelectedRoles(roles.filter((r) => r.isChecked).map((obj) => obj._id));
                }}
                checked={roles.every((x) => x.isChecked)}
                inputProps={{
                  'aria-labelledby': `checkbox-list-label-select-all`
                }}
              />
            }
            label="Select All"
          />
        </FormControl>
      </>
    );
  };

  return (
    // <Dialog
    //   fullWidth
    //   maxWidth="xs"
    //   open={rolesDialogOpen}
    //   onClose={handleCloseDialog}
    //   aria-labelledby="assign-roles-dialog"
    // >
    <>
      {!isRenderedFromUserSetUp && <CustomDialogHeader title="Assign roles" />}
      <CustomDialogContent>
        {loadingRoles ? (
          <Loader text="Loading Roles" />
        ) : rolesConst.length ? (
          <>
            <ListingPageHeader
              showSearchInMobile={true}
              leftSideContents={leftSideContents()}
              searchValue={search}
              onSearch={handleSearch}
              isActionButtonVisible={false}
              isAddButtonVisible={false}
              setQueryString={false}
            />
            <List style={{ padding: 0 }}>
              {roles.map((role) => (
                <ListItem divider key={role._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => {
                        role.isChecked = e.target.checked;
                        setSelectedRoles(roles.filter((r) => r.isChecked).map((obj) => obj._id));
                      }}
                      checked={role.isChecked}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${role._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={role.name} secondary={role.description} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>All Roles has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        {!isRenderedFromUserSetUp && (
          <ThemeButton disabled={isAssigning} onClick={handleCloseDialog} buttonType="transparent">
            Cancel
          </ThemeButton>
        )}
        <ThemeButton disabled={!selectedRoles.length || isAssigning} onClick={handleAssignRoles} buttonType="theme">
          {isAssigning ? <CircularProgress size={22} /> : isRenderedFromUserSetUp ? 'Save & Finish' : 'Save'}
        </ThemeButton>
      </CustomDialogFooter>

      {/* // </Dialog> */}
    </>
  );
};

export default AssignRolesDialog;
