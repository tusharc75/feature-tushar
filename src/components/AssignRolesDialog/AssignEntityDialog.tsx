import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { roleTypes } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import Loader from '../Loader';
import { ListingPageHeader } from '../PageHeaders';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
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

const AssignEntityDialog = ({
  entitiesDialogOpen,
  onSuccess,
  handleCloseDialog,
  ids,
  type,
  assignedEntity,
  regionalRole,
  isRenderedFromContact = false,
  entityAccessIds = [],
  roleAccessIds = [],
  contactResource = ''
}) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();

  const [data, setData] = useState([]);
  const [dataConst, setDataConst] = useState([]);
  const [role, setRole] = useState([]);
  const [roleConst, setRoleConst] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedData, setSelectedData] = useState(regionalRole ? [ids[1]] : []);
  const [selectedRole, setSelectedRole] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [, setCheckAll] = useState(false);
  const steps = [`Select ${type}`, 'Select Role'];
  const [search, setSearch] = useState('');
  const classes = useStyles();

  const handleNext = () => {
    setSearch('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  useEffect(() => {
    setLoadingData(true);
    if (type == 'user') {
      axiosInstance()
        .get(`/${type}`)
        .then(({ data: { data } }) => {
          setData(
            data.filter((user) => !assignedEntity.some((item) => item?._id === user?._id)).map((obj) => ({ ...obj, isChecked: false, show: true }))
          );
          setDataConst(
            data.filter((user) => !assignedEntity.some((item) => item?._id === user?._id)).map((obj) => ({ ...obj, isChecked: false, show: true }))
          );
          setLoadingData(false);
        })
        .catch((error) => {
          setLoadingData(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      setLoadingData(false);
      setData(
        user?.entity?.map((obj) => ({
          ...obj,
          optionLabel: obj.entityName,
          optionValue: obj._id,
          isChecked: false,
          show: true
        }))
      );
      setDataConst(
        user?.entity?.map((obj) => ({
          ...obj,
          optionLabel: obj.entityName,
          optionValue: obj._id,
          isChecked: false,
          show: true
        }))
      );
    }

    axiosInstance()
      .get(`/role?type=${roleTypes.find((d) => d.key === 'Regional')?.value}`)
      .then(({ data: { data } }) => {
        if (regionalRole) {
          setRole(
            data
              .filter(
                (role) => !assignedEntity.find((element) => element.entity._id === selectedData[0]).role.some((item) => item?._id === role?._id)
              )
              .map((obj) => ({ ...obj, isChecked: false }))
          );
          setRoleConst(
            data
              .filter(
                (role) => !assignedEntity.find((element) => element.entity._id === selectedData[0]).role.some((item) => item?._id === role?._id)
              )
              .map((obj) => ({ ...obj, isChecked: false }))
          );
        } else {
          setRole(
            data
              .filter((item) => (roleAccessIds && roleAccessIds?.includes(item._id)) || item?.canAssignByAnyuser)
              .map((obj) => ({ ...obj, isChecked: false }))
          );
          setRoleConst(
            data
              .filter((item) => (roleAccessIds && roleAccessIds?.includes(item._id)) || item?.canAssignByAnyuser)
              .map((obj) => ({ ...obj, isChecked: false }))
          );
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
    };
    axiosInstance()
      .put('/user/create-user-from-contact', payLoad)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        handleCloseDialog();
      });
  };

  const handleAssignEntity = async () => {
    if (selectedData.length) {
      setAssigning(true);
      let dataObj: any;
      if (type === 'entity') {
        dataObj = {
          users: ids,
          entities: selectedData,
          roles: selectedRole
        };
      } else {
        dataObj = {
          users: selectedData,
          entities: ids,
          roles: selectedRole
        };
      }
      await axiosInstance()
        .put(type === 'entity' ? `/user/assign-multiple-entities` : `/user/assign-regional-role`, dataObj)
        .then(() => {
          setAssigning(false);
          if (regionalRole) {
            toastConfig.setToastConfig({
              message: `Role Assigned Successfully`,
              type: 'success',
              open: true
            });
          } else {
            toastConfig.setToastConfig({
              message: `${startCase(type)} Assigned Successfully`,
              type: 'success',
              open: true
            });
          }
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
        if (type === 'entity') {
          return data.entityName?.toLowerCase().search(value?.trim()?.toLowerCase()) !== -1;
        } else {
          return (
            data.concatedName?.toLowerCase().search(value?.trim()?.toLowerCase()) !== -1 ||
            data.email?.toLowerCase().search(value?.trim()?.toLowerCase()) !== -1
          );
        }
      });
      setData(resultData);
    } else {
      resultRole = roleConst?.filter((data) => {
        return (
          data.name.toLowerCase().search(value?.trim()?.toLowerCase()) !== -1 ||
          data.description.toLowerCase().search(value?.trim()?.toLowerCase()) !== -1
        );
      });
      setRole(resultRole);
    }
  };

  function getStepContent(step: number) {
    switch (step) {
      case 0:
        return (
          <ul key={0}>
            {data.map((d) => (
              <li
                className="flex gap-2 px-2 py-2 text-[var(--primary-text)] md:px-[15px]"
                style={{ borderBottom: '1px solid var(--common-border-color)' }}
              >
                <div>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      d.isChecked = e.target.checked;
                      setSelectedData(data.filter((d) => d.isChecked).map((obj) => obj._id));
                      setCheckAll(!data.some((d) => d.isChecked === false));
                    }}
                    checked={d.isChecked}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${d._id}`
                    }}
                  />
                </div>
                <div>
                  <h6 className="MuiTypography-body1 line-clamp-1 text-[16px] font-[500_!important]">
                    {type === 'entity' ? d.entityName : d.concatedName}
                  </h6>
                  <p className="MuiTypography-body2 line-clamp-1">{type === 'user' ? d.email : d?.address?.optionLabel || d?.address || ''}</p>
                </div>
              </li>
            ))}
          </ul>
        );
      case 1:
        return (
          <ul style={{ padding: 0 }} key={1}>
            {role.map((d) => (
              <li
                className="flex gap-2 px-2 py-2 text-[var(--primary-text)] md:px-[15px]"
                style={{ borderBottom: '1px solid var(--common-border-color)' }}
              >
                <div>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      d.isChecked = e.target.checked;
                      setSelectedRole(role.filter((r) => r.isChecked).map((obj) => obj._id));
                    }}
                    checked={d.isChecked}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${d._id}`
                    }}
                  />
                </div>
                <div>
                  <h6 className="MuiTypography-body1 line-clamp-1 text-[16px] font-[500_!important]">{d.name || ''}</h6>
                  <p className="MuiTypography-body2 line-clamp-1">{d.description || ''}</p>
                </div>
              </li>
            ))}
          </ul>
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
            className="m-0"
            control={
              <Checkbox
                edge="start"
                onChange={(e) => {
                  if (activeStep === 0 && !regionalRole) {
                    data.forEach((d) => (d.isChecked = e.target.checked));
                    setSelectedData(data.filter((r) => r.isChecked).map((obj) => obj._id));
                  } else {
                    role.forEach((d) => (d.isChecked = e.target.checked));
                    setSelectedRole(role.filter((r) => r.isChecked).map((obj) => obj._id));
                  }
                }}
                checked={activeStep === 0 && !regionalRole ? data.every((x) => x.isChecked) : role.every((x) => x.isChecked)}
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
    <>
      <CustomDialogHeader
        showRequiredLabel={false}
        title={regionalRole ? `Assign Role` : type === 'entity' ? 'Assign Entities - Roles' : `Assign  ${startCase(type)}`}
      />
      <CustomDialogContent>
        <div className="p-3 md:p-4">
          {!regionalRole ? (
            loadingData ? (
              <Loader text={`Loading ${startCase(type)}`} />
            ) : dataConst.length ? (
              <>
                <ListingPageHeader
                  showSearchInMobile={true}
                  leftSideContents={leftSideContents()}
                  isActionButtonVisible={false}
                  isAddButtonVisible={false}
                  setQueryString={false}
                  searchValue={search}
                  onSearch={handleSearch}
                />

                <div className="mt-3 grid gap-[20px]">
                  {steps.map((label, index) => (
                    <div key={label} className="relative">
                      <h4 className="flex items-center gap-[18px] text-[14px] text-[var(--primary-text)] max-[600px]:ml-[6px]">
                        <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-[--primary] text-[12px] text-white">
                          {activeStep > index ? <Check className="block" style={{ fontSize: 14 }} /> : index + 1}
                        </span>
                        <span>{label}</span>
                      </h4>
                      {activeStep === index && (
                        <div
                          style={{ borderLeft: '1px dashed var(--common-border-color)' }}
                          className="absolute left-[10px] top-[20px]  z-10 hidden h-full w-[2px] -translate-x-1/2 -translate-y-1/2 transform min-[600px]:block"
                        ></div>
                      )}
                      <Collapse in={activeStep === index}>
                        <div className="max-w-full  min-[600px]:ml-[35px]">
                          <div className="max-w-full">{getStepContent(index)}</div>
                          <div className={classes.actionsContainer}>
                            <div>
                              <Button size="small" disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                                Back
                              </Button>
                              {activeStep !== steps.length - 1 && (
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
                              )}
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Typography>{`All ${startCase(type)} has been assigned`}</Typography>
            )
          ) : roleConst ? (
            roleConst?.length ? (
              <List style={{ padding: 0 }}>
                {role.map((d) => (
                  <ListItem divider key={d._id}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          d.isChecked = e.target.checked;
                          setSelectedRole(role.filter((r) => r.isChecked).map((obj) => obj._id));
                        }}
                        checked={d.isChecked}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-${d._id}`
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={d.name || ''} secondary={d.description || ''} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>{`All Region wide functional role has been assigned`}</Typography>
            )
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isAssigning} onClick={handleCloseDialog} color="primary" size="small">
          Cancel
        </Button>
        <Button
          disabled={!selectedData?.length || !selectedRole?.length || isAssigning}
          onClick={isRenderedFromContact ? handleAccessPortal : handleAssignEntity}
          color="primary"
          size="small"
          variant="contained"
          endIcon={isAssigning && <CircularProgress size={20} />}
        >
          {'Save'}
        </Button>
      </CustomDialogFooter>
    </>
  );
};

export default AssignEntityDialog;
