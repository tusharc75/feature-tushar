import { useState, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
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
import SearchBox from "../Helpers/SearchBox";
import { useData } from "../../StateProvider/Provider";

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
  regionalRole,
  isRenderedFromUserSetUp = false,
  isRenderedFromContact = false,
  entityAccessIds = [],
  roleAccessIds = [],
  contactResource = '',
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState([]);
  const [dataConst, setDataConst] = useState([]);
  const [role, setRole] = useState([]);
  const [roleConst, setRoleConst] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedData, setSelectedData] = useState(regionalRole ? [ids[1]] : []); //for regional role assignment only in entity ids[1] has the value of selected entity
  const [selectedRole, setSelectedRole] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [, setCheckAll] = useState(false);
  const steps = [`Select ${type}`, 'Select Role']
  const [search, setSearch] = useState("");
  const classes = useStyles();

  const handleNext = () => {
    setSearch('')
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  useEffect(() => {
    setLoadingData(true);
    if (type == "user") {
      axiosInstance()
        .get(`/${type}`)
        .then(({ data: { data } }) => {
          setData(data.filter(user => !assignedEntity.some(item => item?._id === user?._id)).map(obj => ({ ...obj, isChecked: false, show: true })));
          setDataConst(data.filter(user => !assignedEntity.some(item => item?._id === user?._id)).map(obj => ({ ...obj, isChecked: false, show: true })));
          setLoadingData(false);
        })
        .catch((error) => {
          setLoadingData(false);
          toastConfig.setToastConfig(error);
        });
    }
    else {
      setLoadingData(false);
      setData(JSON.parse(localStorage.getItem("mappedEntities")).map(obj => ({ ...obj, entityName: obj.optionLabel, _id: obj.optionValue, isChecked: false, show: true })));
      setDataConst(JSON.parse(localStorage.getItem("mappedEntities")).map(obj => ({ ...obj, entityName: obj.optionLabel, _id: obj.optionValue, isChecked: false, show: true })));
    }

    axiosInstance()
      .get(`/role?type=${roleTypes.find((d) => d.key === "Regional")?.value}`)
      .then(({ data: { data } }) => {

        if (regionalRole) {
          setRole(data.filter(role => !assignedEntity.find(element => element.entity._id === selectedData[0]).role.some(item => item?._id === role?._id)).map(obj => ({ ...obj, isChecked: false })))
          setRoleConst(data.filter(role => !assignedEntity.find(element => element.entity._id === selectedData[0]).role.some(item => item?._id === role?._id)).map(obj => ({ ...obj, isChecked: false })))
        }
        else {
          setRole(data.filter((item) => roleAccessIds && roleAccessIds.length > 0 ? roleAccessIds.includes(item._id) : true).map(obj => ({ ...obj, isChecked: false })))
          setRoleConst(data.filter((item) => roleAccessIds && roleAccessIds.length > 0 ? roleAccessIds.includes(item._id) : true).map(obj => ({ ...obj, isChecked: false })))
        }
        setLoadingData(false);
      })
      .catch((error) => {
        setLoadingData(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAccessPortal = () => {
    let payLoad = {
      [contactResource]: ids,
      entities: selectedData,
      roles: selectedRole
    }
    axiosInstance()
      .put('/user/create-user-from-contact', payLoad)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        })
        onSuccess()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        handleCloseDialog();
      })
  }


  const handleAssignEntity = async () => {
    if (selectedData.length) {
      setAssigning(true);
      let dataObj: any;

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

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let resultData = [];
    let resultRole = [];
    if (activeStep === 0) {
      resultData = dataConst.filter((data) => {
        if (type === "entity") {
          return data.entityName?.toLowerCase().search(value.toLowerCase()) !== -1
        }
        else {
          return data.concatedName?.toLowerCase().search(value.toLowerCase()) !== -1 || data.email?.toLowerCase().search(value.toLowerCase()) !== -1;
        }
      });
      setData(resultData)
    } else {
      resultRole = roleConst.filter((data) => {
        return data.name.toLowerCase().search(value.toLowerCase()) !== -1 || data.description.toLowerCase().search(value.toLowerCase()) !== -1;
      });
      setRole(resultRole)
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
                primary={type === "entity" ? d.entityName : d.concatedName}
                secondary={type === "user" ? d.email : d?.address?.optionLabel || d?.address || ""}
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
    // <Dialog
    //   fullWidth
    //   maxWidth="sm"
    //   open={entitiesDialogOpen}
    //   onClose={handleCloseDialog}
    //   aria-labelledby="assign-roles-dialog"
    // >
    <>
      {!isRenderedFromUserSetUp && <CustomDialogHeader title={regionalRole ? `Assign role` : type === "entity" ? 'Assign Entities - Roles' : `Assign  ${startCase(type)}`} />}
      <CustomDialogContent>
        {!regionalRole ? (loadingData ? (
          <Loader text={`Loading ${startCase(type)}`} />
        ) : dataConst.length ? (
          <>
            <Grid container>
              <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
                <FormControl component="fieldset">
                  <FormControlLabel
                    value="top"
                    control={
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          if (activeStep === 0 && !regionalRole) {
                            data.forEach((d) => d.isChecked = e.target.checked)
                            setSelectedData(data.filter(r => r.isChecked).map(obj => obj._id))
                          }
                          else {
                            role.forEach((d) => d.isChecked = e.target.checked)
                            setSelectedRole(role.filter(r => r.isChecked).map(obj => obj._id))
                          }
                        }
                        }
                        checked={activeStep === 0 && !regionalRole ? data.every(x => x.isChecked) : role.every(x => x.isChecked)}
                        inputProps={{
                          "aria-labelledby": `checkbox-list-label-select-all`,
                        }}
                      />}
                    label="Select all "
                  />
                </FormControl>

              </Grid>
              <Grid item xs={12} md={6} sm={6} container justify="flex-end">
                <SearchBox
                  onSearch={handleSearch}
                  searchbox="terms_header_search_bar"
                  width="300px"
                  value={search}
                />
              </Grid>
            </Grid>
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
                            disabled={selectedData.length === 0}
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
          </>
        ) : (
          <Typography>{`All ${startCase(type)} has been assigned`}</Typography>
        )) : roleConst.length ? (<List style={{ padding: 0 }}>
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
        {!isRenderedFromUserSetUp &&
          <Button
            disabled={isAssigning}
            onClick={handleCloseDialog}
            color="primary"
            size="small"
          >
            Cancel
          </Button>
        }
        <Button
          disabled={!selectedData?.length || !selectedRole?.length}
          onClick={isRenderedFromContact ? handleAccessPortal : handleAssignEntity}
          color="primary"
          size="small"
          variant="contained"
        >
          {isAssigning ? <CircularProgress size={22} /> : isRenderedFromUserSetUp ? "Save & Continue" : "Save"}          </Button>
      </CustomDialogFooter>
      {/* </Dialog> */}
    </>
  );
};

export default AssignEntityDialog;