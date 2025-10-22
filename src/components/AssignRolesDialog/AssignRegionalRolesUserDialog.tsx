import {
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Theme,
  Typography
} from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Step from '@mui/material/Step';
import StepContent from '@mui/material/StepContent';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { makeStyles } from '@mui/styles';
import { useContext, useEffect, useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import Loader from '../Loader';
import { ListingPageHeader } from '../PageHeaders';

const useStyles = makeStyles((theme: Theme) => ({
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  actionsContainer: {
    marginBottom: theme.spacing(2)
  },
  resetContainer: {
    padding: theme.spacing(3)
  }
}));

const AssignRegionalRolesUserDialog = ({ entitiesDialogOpen, onSuccess, handleCloseDialog, ids, assignedUsers, entityAccessIds = [] }) => {
  const toastConfig = useContext(CustomToastContext);
  const [entity, setEntity] = useState([]);
  const [entityConst, setEntityConst] = useState([]);
  const [user, setUser] = useState([]);
  const [userConst, setUserConst] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const steps = [`Select User`, 'Select Entity'];
  const [search, setSearch] = useState('');
  const classes = useStyles();

  const handleNext = () => {
    handleSearch('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    handleSearch('');
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  useEffect(() => {
    setLoadingData(true);
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        setUser(data.filter((user) => !assignedUsers.some((item) => item?._id === user?._id)));
        setUserConst(data.filter((user) => !assignedUsers.some((item) => item?._id === user?._id)));
        setLoadingData(false);
      })
      .catch((error) => {
        setLoadingData(false);
        toastConfig.setToastConfig(error);
      });

    axiosInstance()
      .get(`/entity`)
      .then(({ data: { data } }) => {
        setEntity(data.filter((item) => entityAccessIds.includes(item._id)));
        setEntityConst(data.filter((item) => entityAccessIds.includes(item._id)));
        setLoadingData(false);
      })
      .catch((error) => {
        setLoadingData(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    let value = e?.target?.value || '';
    setSearch(value);

    const resultUser = userConst.filter((data) => {
      return data.concatedName?.toLowerCase().search(value.toLowerCase()) !== -1 || data.email?.toLowerCase().search(value.toLowerCase()) !== -1;
    });
    setUser(resultUser);

    const resultEntity = entityConst.filter((data) => {
      return data.entityName?.toLowerCase().search(value.toLowerCase()) !== -1;
    });
    setEntity(resultEntity);
  };

  const handleAssignEntity = async () => {
    let dataObj = {
      users: selectedUser,
      entities: selectedEntity,
      roles: ids
    };

    await axiosInstance()
      .put(`/user/assign-regional-role`, dataObj)
      .then(() => {
        setAssigning(false);
        toastConfig.setToastConfig({
          message: `User assigned successfully`,
          type: 'success',
          open: true
        });

        onSuccess();
      })
      .catch((error) => {
        setAssigning(false);
        toastConfig.setToastConfig(error);
      });
  };

  function getStepContent(step: number) {
    switch (step) {
      case 0:
        return (
          <List style={{ padding: 0 }}>
            {user.map((d) => (
              <ListItem divider key={d._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUser(prev => [...prev, d._id]);
                      } else {
                        setSelectedUser(prev => prev.filter(id => id !== d._id));
                      }
                    }}
                    checked={selectedUser.includes(d._id)}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${d._id}`
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary={d.concatedName} secondary={d.email || ''} />
              </ListItem>
            ))}
          </List>
        );
      case 1:
        return (
          <List style={{ padding: 0 }}>
            {entity.map((d) => (
              <ListItem divider key={d._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntity(prev => [...prev, d._id]);
                      } else {
                        setSelectedEntity(prev => prev.filter(id => id !== d._id));
                      }
                    }}
                    checked={selectedEntity.includes(d._id)}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${d._id}`
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary={d.entityName || ''} secondary={d?.address?.optionLabel || d?.address || ''} />
              </ListItem>
            ))}
          </List>
        );

      default:
        return 'Unknown step';
    }
  }

  const leftSideContents = () => {
    return (
      <>
        <FormControl component="fieldset">
          <FormControlLabel
            value="top"
            control={
              <Checkbox
                edge="start"
                className="m-0"
                onChange={(e) => {
                  if (activeStep === 0) {
                    if (e.target.checked) {
                      const visibleUserIds = user.map(u => u._id);
                      setSelectedUser(prev => [...new Set([...prev, ...visibleUserIds])]);
                    } else {
                      const visibleUserIds = user.map(u => u._id);
                      setSelectedUser(prev => prev.filter(id => !visibleUserIds.includes(id)));
                    }
                  } else {
                    if (e.target.checked) {
                      const visibleEntityIds = entity.map(e => e._id);
                      setSelectedEntity(prev => [...new Set([...prev, ...visibleEntityIds])]);
                    } else {
                      const visibleEntityIds = entity.map(e => e._id);
                      setSelectedEntity(prev => prev.filter(id => !visibleEntityIds.includes(id)));
                    }
                  }
                }}
                checked={activeStep === 0 ?
                  user.length > 0 && user.every(u => selectedUser.includes(u._id)) :
                  entity.length > 0 && entity.every(e => selectedEntity.includes(e._id))
                }
                inputProps={{
                  'aria-labelledby': `checkbox-list-label-select-all`
                }}
              />
            }
            label="Select all "
          />
        </FormControl>
      </>
    );
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="sm"
      open={entitiesDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={`Assign  User`} />
      <CustomDialogContent>
        {loadingData ? (
          <Loader text={`Loading User`} />
        ) : userConst.length ? (
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
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    <Typography>{getStepContent(index)}</Typography>
                    <div className={classes.actionsContainer}>
                      <div>
                        <ThemeButton buttonType="transparent" disabled={activeStep === 0} onClick={handleBack}>
                          Back
                        </ThemeButton>
                        {activeStep !== steps.length - 1 && (
                          <ThemeButton buttonType="theme" onClick={handleNext} disabled={selectedUser.length === 0} className={classes.button}>
                            Next
                          </ThemeButton>
                        )}
                      </div>
                    </div>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </>
        ) : (
          <Typography>{`All user has been assigned`}</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton onClick={handleCloseDialog} buttonType="transparent">
          Cancel
        </ThemeButton>
        <ThemeButton disabled={!selectedEntity?.length || !selectedUser?.length} onClick={handleAssignEntity} buttonType="theme" isLoading={isAssigning}>
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignRegionalRolesUserDialog;
