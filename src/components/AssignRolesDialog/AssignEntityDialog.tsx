import React, { useState, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  TextField,
  Typography,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import Loader from "../Loader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { startCase } from "lodash";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import { roleTypes } from "../../constants/helpers";

const useStyles = makeStyles((theme) => ({

  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  actionsContainer: {
    marginBottom: theme.spacing(2),
  },
  resetContainer: {
    padding: theme.spacing(3),
  },
}));

const AssignEntityDialog = ({
  entitiesDialogOpen,
  onSuccess,
  handleCloseDialog,
  ids,
  type,
  assignedEntity,
  regionalRole
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState([]);
  const [role, setRole] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedData, setSelectedData] = useState(regionalRole ? [ids[1]] : []); //for regional role assignment only in entity ids[1] has the value of selected entity
  const [selectedRole, setSelectedRole] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [checkAll, setCheckAll] = useState(false);
  const steps = [`Select ${type}`, 'Select Regional Wide Functional Role']
  const classes = useStyles();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };


  useEffect(() => {
    setLoadingData(true);
    axiosInstance()
      .get(`/${type}`)
      .then(({ data: { data } }) => {
        if (type == "user") {
          setData(data.filter(user => !assignedEntity.some(item => item?._id === user?._id)).map(obj => ({ ...obj, isChecked: false, show: true })));
        }
        else {
          setData(data.filter(user => !assignedEntity.some(item => item?.entity._id === user?._id)).map(obj => ({ ...obj, isChecked: false, show: true })));
        }
        setLoadingData(false);
      })
      .catch((error) => {
        setLoadingData(false);
        toastConfig.setToastConfig(error);
      });

    axiosInstance()
      .get(`/role?type=${roleTypes.find((d) => d.key === "Regional")?.value}`)
      .then(({ data: { data } }) => {

        regionalRole ?
          setRole(data.filter(role => !assignedEntity.find(element => element.entity._id === selectedData[0]).role.some(item => item?._id === role?._id)).map(obj => ({ ...obj, isChecked: false })))
          : setRole(data.map(obj => ({ ...obj, isChecked: false })))
        setLoadingData(false);
      })
      .catch((error) => {
        setLoadingData(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);


  const handleAssignEntity = async () => {
    if (selectedData.length) {
      setAssigning(true);
      let dataObj: any;
      let entityArray = []
      if (type === "entity") {
        dataObj = {
          users: ids,
          entities: selectedData,
          roles: selectedRole
        };
      }

      else {
        dataObj = {
          users: selectedData,
          entities: ids,
          roles: selectedRole
        };

      }
      await axiosInstance()
        .put(type === "entity" ? `/user/assign-multiple-entities` : `/user/assign-regional-role`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: `${startCase(type)} assigned successfully`,
            type: "success",
            open: true,
          });

          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  function getStepContent(step: number) {
    switch (step) {
      case 0:
        return <List style={{ padding: 0 }}>

          {/* <ListItem divider>
            <ListItemIcon>
              <Checkbox
                edge="start"
                onChange={(e) => {
                  setCheckAll(e.target.checked);

                  const newData = data.map(d => {
                    return {
                      ...d,
                      isChecked: e.target.checked
                    }
                  });
                  setData(newData);
                  setSelectedData(newData.filter(d => d.isChecked).map(obj => obj._id))
                }}
                checked={checkAll}
                inputProps={{
                  "aria-labelledby": `checkbox-list-label-check-all-user`,
                }}
              />
            </ListItemIcon>
            <ListItemText primary="Select all" />
          </ListItem> */}

          {data.map((d) => (
            <ListItem divider key={d._id}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  onChange={(e) => {
                    d.isChecked = e.target.checked
                    setSelectedData(data.filter(d => d.isChecked).map(obj => obj._id))
                    setCheckAll(!data.some(d => d.isChecked === false));
                  }
                  }
                  checked={d.isChecked}
                  inputProps={{
                    "aria-labelledby": `checkbox-list-label-${d._id}`,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={type === "entity" ? d.entityName : `${d.firstName} ${d.lastName}` || ""}
                secondary={type === "user" ? d.email : d.address || ""}
              />
            </ListItem>
          ))}
        </List>
      case 1:
        return <List style={{ padding: 0 }}>
          {role.map((d) => (
            <ListItem divider key={d._id}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  onChange={(e) => {
                    d.isChecked = e.target.checked
                    setSelectedRole(role.filter(r => r.isChecked).map(obj => obj._id))
                  }
                  }
                  checked={d.isChecked}
                  inputProps={{
                    "aria-labelledby": `checkbox-list-label-${d._id}`,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={d.name || ""}
                secondary={d.description || ""}
              />
            </ListItem>
          ))}
        </List>

      default:
        return 'Unknown step';
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={entitiesDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={regionalRole ? `Assign  Region wide functional role` : `Assign  ${startCase(type)}`} />
      <CustomDialogContent>
        {!regionalRole ? (loadingData ? (
          <Loader text={`Loading ${startCase(type)}`} />
        ) : data.length ? (
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Typography>{getStepContent(index)}</Typography>
                  <div className={classes.actionsContainer}>
                    <div>
                      <Button
                        size="small"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        className={classes.button}
                      >
                        Back
                      </Button>
                      {(activeStep !== steps.length - 1) &&
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleNext}
                          disabled={selectedData.some(item => item?.isChecked)}
                          className={classes.button}
                        >
                          Next
                        </Button>
                      }
                    </div>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        ) : (
          <Typography>{`All ${startCase(type)} has been assigned`}</Typography>
        )) : role.length ? (<List style={{ padding: 0 }}>
          {role.map((d) => (
            <ListItem divider key={d._id}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  onChange={(e) => {
                    d.isChecked = e.target.checked
                    setSelectedRole(role.filter(r => r.isChecked).map(obj => obj._id))
                  }
                  }
                  checked={d.isChecked}
                  inputProps={{
                    "aria-labelledby": `checkbox-list-label-${d._id}`,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={d.name || ""}
                secondary={d.description || ""}
              />
            </ListItem>
          ))}
        </List>) : (
          <Typography>{`All Region wide functional role has been assigned`}</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
          size="small"
        >
          Cancel
        </Button>
        <Button
          disabled={!selectedData?.length || !selectedRole?.length}
          onClick={handleAssignEntity}
          color="primary"
          size="small"
          variant="contained"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignEntityDialog;
