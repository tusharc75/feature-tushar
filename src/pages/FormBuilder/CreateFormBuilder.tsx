import React, { useState, useEffect, Fragment, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Button, CircularProgress, Menu, MenuItem, IconButton, makeStyles, useMediaQuery } from '@material-ui/core';
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
import { isEqual } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { IoIosArrowDropdown } from 'react-icons/io';
import { RiCloseCircleFill, RiSaveFill } from 'react-icons/all';
import TextField from '@material-ui/core/TextField';
import { camelCase } from 'lodash';
import { Autocomplete } from '@material-ui/lab';
import History from "./History"

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
    state: { permissions }
  }: any = useData();
  const [formBuilderPermissions, setFormBuilderPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });
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

  const sectionNameList = ['Sales Management', 'eCommerce', 'Inventory Management',
    'Rental Operations Management', 'Repair & Maintenance Management', 'Purchasing Management', 'Planning & Forecasting'];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (permissions && permissions.formBuilder) {
      setFormBuilderPermissions(permissions.formBuilder);
    }
  }, [permissions]);

  const onBackButtonEvent = (e) => {
    e.preventDefault();
    window.history.pushState(null, null, window.location.pathname);
    if (formBuilderPermissions.isUpdate) setShowConfirmDialog(true);
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
  }, []);

  const fetchBrandResourceData = async () => {
    axiosInstance()
      .get(`/sa-formbuilder/resourcedata/` + resource)
      .then(({ data: { data } }) => {
        setSection(data.section);
        setsectionName(data.sectionName || '');
        setResourceLabel(data.resourceLabel);
        setHomePageLabel(data?.homePageLabel || '');
        setOriSection(JSON.parse(JSON.stringify(data.section)));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = async () => {
    if (resourceLabel === '') {
      alert('Please enter resource label');
      return;
    }
    let data = [];
    let order = 0;
    section.forEach((_section) => {
      _section.field.forEach((_field) => {
        let _field_data = _field;
        _field_data._id = _field_data._id.toString();
        _field_data.sectionName = _section.sectionName;
        if (!isNaN(_field._id)) {
          _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''));
        }
        _field_data.order = ++order;
        if (!_field_data.roleType) {
          _field_data.roleType = 0;
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
    setIsUpdating(true);
    axiosInstance()
      .put(`/sa-formbuilder/resourcedata`, sendData)
      .then(({ data: { data } }) => {
        setIsUpdating(false);
        history.push({ pathname: routes.formBuilder.path });
      })
      .catch((error) => {
        setIsUpdating(false);
        toastConfig.setToastConfig(error);
      });
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
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[routes.formBuilder, { title: resource }]}
              isConfirmBeforeClick={true}
              onBreadCrumbClick={(path) => {
                if (!isEqual(orisection, section) && formBuilderPermissions.isUpdate) {
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
                <label htmlFor="importField" className="cursor-pointer mr-3">
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
              <Box p={1} pb={0} ml={1} bgcolor="white">
                <Grid container spacing={1}>
                  <Grid item xs={2}>
                    <Typography variant="caption">Resource</Typography>
                    <Typography variant="body1">{resource}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Resource Label"
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
                      label="Home Page Label"
                      name="homePageLabel"
                      fullWidth
                      margin="dense"
                      value={homePageLabel}
                      onChange={(e) => {
                        setHomePageLabel(e.target.value.trimStart());
                      }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Autocomplete
                      id="section-name"
                      freeSolo
                      autoSelect
                      options={sectionNameList}
                      getOptionLabel={(option) => option}
                      renderInput={(params) => <TextField {...params} label="Section Name" variant="outlined" margin="dense" fullWidth />}
                      value={sectionName}
                      onChange={(e, value) => {
                        setsectionName(value);
                      }}
                    />
                  </Grid>
                  <Grid item xs={2} container justifyContent="flex-end">
                    <Box>
                      {formBuilderPermissions.isUpdate && (
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
                          if (!isEqual(orisection, section) && formBuilderPermissions.isUpdate) {
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
                <FormBuilder
                  section={section}
                  setSection={setSection}
                  deleteField={deleteField}
                  setDeleteField={setDeleteField}
                  isCustomField={false}
                  extraFields={[]}
                  module="form-builder"
                  resource={resource}
                />
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
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      </Box>
      {openHistoryDialog && (
        <History
          onClose={() => closeHistoryDialog()}
          open={openHistoryDialog}
          resource={resource}
        />
      )
      }
    </Fragment>
  );
};

export default CreateFormBuilder;
