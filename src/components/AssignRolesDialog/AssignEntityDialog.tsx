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
  const [selectedData, setSelectedData] = useState(regionalRole ? [ids[1]] : []);
  const [selectedRole, setSelectedRole] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const steps = [`Select ${type}`, 'Select Regional Role']
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
          setData(data.filter(user => !assignedEntity.some(item => item?._id === user?._id)));
        }
        else {
          setData(data.filter(user => !assignedEntity.some(item => item?.entity._id === user?._id)));
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

  const handleEntitySelection = (e, id) => {
    let tempSelectedEntities = selectedData;
    let curIndex = tempSelectedEntities.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) {
        tempSelectedEntities = [id];
        setSelectedData(tempSelectedEntities);
      }
    } else if (curIndex >= 0) {
      tempSelectedEntities.splice(curIndex, 1);
      setSelectedData([]);

    }

  };


  const handleAssignEntity = async () => {

    if (selectedData.length) {
      setAssigning(true);
      let dataObj: any;
      let entityArray = []
      if (type === "entity") {

        if (assignedEntity.length !== 0) {
          assignedEntity.map(d => {
            if (d.entity?._id !== selectedData[0]) {
              entityArray.push({
                entity: d.entity?._id,
                role: d.role?.map(r => r._id)
              })
            }
            else {
              entityArray.push({
                entity: selectedData[0],
                role: regionalRole ? selectedRole.concat(d.role?.map(r => r._id)) : selectedRole
              })
            }
          })
          if (!assignedEntity.some(item => item?.entity._id === selectedData[0])) {
            entityArray.push({
              entity: selectedData[0],
              role: selectedRole
            })
          }
          dataObj = {
            user: ids[0],
            entities: entityArray
          };
        }
        else {
          dataObj = {
            user: ids[0],
            entities: [
              {
                entity: selectedData[0],
                role: selectedRole
              }
            ]
          };
        }


      } else {
        dataObj = {
          user: selectedData[0],
          entities: [
            {
              entity: ids[0],
              role: selectedRole
            }
          ]
        };

      }

      await axiosInstance()
        .put(`/user/assign-entity`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: ` ${type} assigned successfully`,
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
          {data.map((d) => (
            <ListItem divider key={d._id}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  onChange={(e) => {
                    setSelectedData(selectedData.some(item => item === d._id) ? [] : [d._id])
                  }
                  }
                  checked={selectedData.some(item => item === d._id)}
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
                    d.isChecked = d.isChecked ? false : true
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
      <CustomDialogHeader title={regionalRole ? `Assign  Regional Role` : `Assign  ${startCase(type)}`} />
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
                          onClick={handleNext}
                          disabled={selectedData?.length === 0}
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
                    d.isChecked = d.isChecked ? false : true
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
          <Typography>{`All Regional Role has been assigned`}</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          disabled={!selectedData?.length || !selectedRole?.length}
          onClick={handleAssignEntity}
          color="primary"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignEntityDialog;
