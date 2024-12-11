import React, { useState, useEffect, Fragment, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Button, CircularProgress, Menu, MenuItem, IconButton, makeStyles, useMediaQuery } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { FormBuilder } from '../../components/FormBuilder';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import { checkFormulaLoop, checkUniqueValidation } from '../../constants/formulaUtility';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isEmpty, isEqual, startCase, toLower } from 'lodash';
import { isTablet } from 'react-device-detect';
import { IoIosArrowDropdown } from 'react-icons/io';
import { RiCloseCircleFill, RiSaveFill } from 'react-icons/ri';
import TextField from '@material-ui/core/TextField';
import { Autocomplete } from '@material-ui/lab';
import History from './History';
import Tabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { fieldLabelToFieldName } from 'src/constants/helpers';
import DynamicTabs from 'src/components/FormBuilder/Tabs';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  linksContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    '@media (max-width: 960px)': {
      display: 'none'
    }
  },
  menuButtonList: {
    alignItems: 'flex-start',
    padding: '1px'
  },
  links: {
    color: theme.palette.info.light, //  textDark
    fontSize: 15
  },
  darkLinks: {
    color: theme.palette.info.dark, //  textDark
    fontSize: 15
  },
  linkDivider: {
    backgroundColor: '#ffffff42', //  darkBg
    margin: '0 10px'
  },
  darkLinkDivider: {
    backgroundColor: 'grey', //  darkBg
    margin: '0 10px'
  },
  delBtn: {
    color: 'red'
  },
  expandIcon: {
    position: 'absolute',
    right: '0',
    color: 'white'
  }
}));

const CreateFormBuilder = () => {
  const {
    state: { permissions, user }
  }: any = useData();

  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const history = useHistory();
  const { resource } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const [orisection, setOriSection] = useState(null);
  const [section, setSection] = useState(null);
  const [deleteField, setDeleteField] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [resourceLabel, setResourceLabel] = useState('');
  const [homePageLabel, setHomePageLabel] = useState('');
  const [sectionName, setsectionName] = useState('');
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [steppers, setSteppers] = useState([]);
  const [sectionNameList, setSectionNameList] = useState([]);

  const [isNew, setIsNew] = useState(resource === '0' ? true : false);

  const [tabValue, setTabValue] = useState(0);
  const handleMainTabChange = (event: React.ChangeEvent<{}>, value: any) => {
    setTabValue(value);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onBackButtonEvent = (e) => {
    e.preventDefault();
    window.history.pushState(null, null, window.location.pathname);
    if (permissions.formBuilder?.isUpdate) {
      setShowConfirmDialog(true);
    }
  };

  const handleOpenHistoryDialog = () => {
    setOpenHistoryDialog(true);
  };

  const closeHistoryDialog = () => {
    setOpenHistoryDialog(false);
  };

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', onBackButtonEvent);
    return () => {
      window.removeEventListener('popstate', onBackButtonEvent);
    };
  }, []);

  useEffect(() => {
    fetchBrandResourceData();
    fetchSectionList();
  }, []);

  const fetchBrandResourceData = async () => {
    if (isNew) {
      setSection([]);
      setsectionName('');
      setResourceLabel('');
      setHomePageLabel('');
      setOriSection([]);
      setSteppers([]);
    } else {
      axiosInstance()
        .get(`/sa-formbuilder/resourcedata/` + resource)
        .then(({ data: { data } }) => {
          data?.section?.forEach((s: any) => {
            s?.field?.forEach((f: any) => {
              if (!isEmpty(f?.sectionProperties)) {
                s.sectionProperties = f.sectionProperties;
                delete f.sectionProperties;
              }
            });
          });
          setSection(data.section);
          setsectionName(data.sectionName || '');
          setResourceLabel(data.resourceLabel);
          setHomePageLabel(data?.homePageLabel || '');
          setOriSection(JSON.parse(JSON.stringify(data.section)));
          setSteppers(data?.resourcePolicy?.steppers || []);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const fetchSectionList = async () => {
    await axiosInstance()
      .get(`section-master`)
      .then(({ data: { data } }) => {
        const sectionList = data?.map((ele) => ele.sectionName);
        setSectionNameList(sectionList);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = async () => {
    if (resourceLabel === '') {
      alert('Please enter Resource label');
      return;
    }
    if (homePageLabel === '') {
      alert('Please enter Home Page label');
      return;
    }
    let data = [];
    let order = 0;
    section.forEach((_section) => {
      _section.field.forEach((_field, index) => {
        _field.sectionProperties = {};
        let _field_data = _field;
        _field_data._id = _field_data._id.toString();
        _field_data.sectionName = _section.sectionName;
        if (!isNaN(_field._id)) {
          _field_data.fieldName = fieldLabelToFieldName(_field.fieldLabel);
        }
        _field_data.order = ++order;
        if (!_field_data.roleType) {
          _field_data.roleType = 0;
        }
        if (index === 0 && _section?.sectionProperties) {
          _field['sectionProperties'] = _section.sectionProperties || {};
        }
        data.push(_field_data);
      });
    });
    if (resource.toString().toLowerCase() === 'product') {
      if (data.filter((e) => e.fieldName === 'productTemplate').length) {
        var otherField = [];
        await axiosInstance()
          .get(`/product-template/allfields`)
          .then(({ data: { data } }) => {
            otherField = data;
          })
          .catch((error) => { });
        const result = checkUniqueValidation(data, otherField);
        if (result.error) {
          toastConfig.setToastConfig({
            open: true,
            type: 'error',
            message: result.message
          });
          return false;
        }
      }
    }

    const result = checkFormulaLoop(data);
    if (result.error) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: result.message
      });
      return false;
    }

    let sendData: any = {};
    sendData.resource = resource;
    sendData.field = data;
    sendData.sectionName = sectionName;
    sendData.deleteField = deleteField;
    sendData.resourceLabel = resourceLabel;
    sendData.homePageLabel = homePageLabel;
    if (steppers?.length) {
      sendData.resourcePolicy = {
        steppers: steppers
      };
    }
    setIsUpdating(true);
    if (isNew) {
      sendData.resource = startCase(toLower(resourceLabel));
      sendData.brandId = user.user.brand;
      axiosInstance()
        .post(`/sa-formbuilder`, sendData)
        .then(({ data: { message } }) => {
          setIsUpdating(false);
          history.push('/form-builder');
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(`/sa-formbuilder/resourcedata`, sendData)
        .then(({ data: { message } }) => {
          setIsUpdating(false);
          fetchBrandResourceData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleExportFields = () => {
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(section));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'template_field.json');
    dlAnchorElem.click();
  };

  const handleImportFields = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      setSection(JSON.parse(data));
    };
    reader.readAsBinaryString(f);
  };

  return (
    <Fragment>
      <DeviceMessage />
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[routes.formBuilder, { title: isNew ? 'New' : resource }]}
              isConfirmBeforeClick={true}
              onBreadCrumbClick={(path) => {
                if (!isEqual(orisection, section) && permissions?.isUpdate?.isUpdate) {
                  setShowConfirmDialog(true);
                } else history.push({ pathname: path });
              }}
            />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                size="small"
                className={'btn-outline-v1'}
                onClick={handleOpenHistoryDialog}
              >
                History
              </Button>
              <div className={classes.linksContainer} style={{ display: 'none' }}>
                <label htmlFor="importField" className="mr-3 cursor-pointer">
                  Import Fields
                  <input
                    onClick={(e: any) => (e.target.value = null)}
                    id="importField"
                    name="importField"
                    onChange={handleImportFields}
                    style={{
                      opacity: '0',
                      position: 'absolute',
                      zIndex: -1
                    }}
                    type="file"
                  />
                </label>
                <label className="cursor-pointer" onClick={handleExportFields}>
                  Export Fields
                </label>
                <a id="downloadAnchorElem" style={{ display: 'none' }}></a>
              </div>
              <Menu id="importField" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem>
                  <label htmlFor="importField" className="cursor-pointer">
                    Import Fields
                    <input
                      onClick={(e: any) => (e.target.value = null)}
                      id="importField"
                      name="importField"
                      onChange={handleImportFields}
                      style={{
                        opacity: '0',
                        position: 'absolute',
                        zIndex: -1
                      }}
                      type="file"
                    />
                  </label>
                </MenuItem>
                <MenuItem onClick={handleExportFields}>Export Fields</MenuItem>
              </Menu>
              {isMobile && (
                <IconButton onClick={handleClick} className={classes.menuButtonList}>
                  <IoIosArrowDropdown className={classes.expandIcon} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          {section ? (
            <Fragment>
              <Box mb={2}>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Resource Label (Singular)"
                      required={true}
                      name="name"
                      fullWidth
                      margin="dense"
                      value={resourceLabel}
                      onChange={(e) => {
                        setResourceLabel(e.target.value.trimStart());
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Resource Label (Plural)"
                      required={true}
                      name="homePageLabel"
                      fullWidth
                      margin="dense"
                      value={homePageLabel}
                      onChange={(e) => {
                        setHomePageLabel(e.target.value.trimStart());
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Autocomplete
                      id="section-name"
                      freeSolo
                      autoSelect
                      options={sectionNameList}
                      getOptionLabel={(option) => option}
                      renderInput={(params) => <TextField {...params} label="Section Name" variant="outlined" required margin="dense" fullWidth />}
                      value={sectionName}
                      onChange={(e, value) => {
                        setsectionName(value);
                      }}
                    />
                  </Grid>
                  <Grid item xs={3} container justifyContent="flex-end">
                    <Box>
                      {permissions?.formBuilder?.isUpdate && (
                        <Button
                          disabled={isUpdating}
                          color="primary"
                          size="small"
                          onClick={handleSave}
                          variant={isMobile && !isTablet ? 'text' : 'contained'}
                          style={isMobile && !isTablet ? { color: 'var(--success)' } : {}}
                        >
                          {isMobile && !isTablet ? <RiSaveFill size={24} /> : 'Save'}
                          {isUpdating && <CircularProgress size={24} />}
                        </Button>
                      )}
                    </Box>
                    <Box ml={1}>
                      <Button
                        color="primary"
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        size="small"
                        style={isMobile && !isTablet ? { color: 'var(--error)' } : {}}
                        onClick={() => {
                          if (!isEqual(orisection, section) && permissions?.formBuilder?.isUpdate) {
                            setShowConfirmDialog(true);
                          } else {
                            history.push({ pathname: routes.formBuilder.path });
                          }
                        }}
                      >
                        {' '}
                        {isMobile && !isTablet ? <RiCloseCircleFill size={24} /> : 'Close'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              <Box>
                <Tabs value={tabValue} onChange={handleMainTabChange}>
                  <CustomTab value={0} id="fields-tab">
                    Fields
                  </CustomTab>
                  <CustomTab value={1} id="tab-2">
                    Tabs
                  </CustomTab>
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                  <FormBuilder
                    section={section}
                    setSection={setSection}
                    deleteField={deleteField}
                    setDeleteField={setDeleteField}
                    isCustomField={false}
                    extraFields={[]}
                    module="form-builder"
                    resource={resource}
                    brandId={user.user.brand}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <DynamicTabs resource={resource} />
                </TabPanel>
              </Box>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleSave();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    history.push({ pathname: routes.formBuilder.path });
                  }}
                />
              ) : null}
            </Fragment>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      </Box>
      {openHistoryDialog && <History onClose={() => closeHistoryDialog()} resource={resource} />}
    </Fragment>
  );
};

export default CreateFormBuilder;
