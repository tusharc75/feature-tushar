import React, { useContext, useState } from 'react';
import { Divider, IconButton, makeStyles, useMediaQuery, Menu, MenuItem, Box } from '@material-ui/core';
import { IoIosArrowDropdown } from 'react-icons/io';
import axiosInstance from '../../axios/axiosInstance';
import { downloadExcel } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import SelectionDialog from './SelectionDialog';
import { isEmpty } from 'lodash';
import { useEffect } from 'react';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  custom_root: {
    paddingRight: 10,
    display: 'flex',
    alignItems: 'center'
  },
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ['@media (max-width: 960px)']: {
      display: 'none'
    }
  },
  links: {
    color: theme.palette.info.light, //  textDark
    fontSize: 15
  },
  custom_links: {
    color: '#484848',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  linkDivider: {
    backgroundColor: '#9582822e', //  darkBg
    margin: '0 10px'
  },
  delBtn: {
    color: 'red'
  },
  expandIcon: {
    position: 'absolute',
    right: '0',
    color: '#3e3e3e'
  },
  custom_expandIcon: {
    position: 'absolute',
    right: '0',
    color: 'black'
  }
}));

export default function ImportExportLinks({
  ids = [],
  permissions,
  module,
  api,
  refrenceId,
  onSuccessfulImport,
  recordsToExport = 0,
  exportSelectedRecords = null,
  isExportAllOrSomeFeature = false,
  onExportToExcelSuccess = () => { },
  total = 0,
  additionalParams = null,
  extraImportExportLinks = []
}) {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const toastConfig = useContext(CustomToastContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSelection, setIsSelection] = useState(false);
  const [isUpladDialog, setIsUploadDialog] = useState(false);
  const [anchorExtraEl, setAnchorExtraEl] = useState(null);

  const [imptExptDnldMenuDta, setImptExptDnldMenuDta] = useState({ anchorEl: null, action: null, open: false });

  const handleOpenMenu = (e, action) => {
    setImptExptDnldMenuDta({ action, anchorEl: e.currentTarget, open: true });
  };

  const handleCloseMenu = () => {
    setImptExptDnldMenuDta({ anchorEl: null, action: null, open: false });
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExtraClick = (event) => {
    setAnchorExtraEl(event.currentTarget);
  };
  const handleExtraClose = () => {
    setAnchorExtraEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!isSelection) {
      setIsUploadDialog(false);
    }
  }, [isSelection]);

  const uploadData = (event, data: any = null) => {
    setIsSelection(false);
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Uploading ${module}, Please wait...`
      });
      const file = event.target.files[0];
      let formData = new FormData();
      formData.append('file', file);
      formData.append('refrenceId', refrenceId);
      if (!isEmpty(data)) {
        formData.append('productCategory', data.productCategory);
        formData.append('productTemplate', data.productTemplate);
        formData.append('priceTemplate', data.priceTemplate);
      }
      axiosInstance()
        .post(`${api}/import`, formData, {
          responseType: 'blob',
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          if (!response.headers['content-disposition']) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'All Records Added Successfully'
            });
            onSuccessfulImport(true);
          } else {
            const fileName = response.headers['content-disposition'].split('filename=')[1];
            downloadExcel(response.data, fileName);
            toastConfig.setToastConfig({
              open: true,
              type: 'error',
              message: `Found some issue(s) while importing ${module}`
            });
            onSuccessfulImport(true);
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const uploadExtraData = (event, apiUrl = null) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Uploading ${module}, Please wait...`
      });
      const file = event.target.files[0];

      let formData = new FormData();
      formData.append('file', file);

      let importApi = `${api}/import`;

      if (additionalParams) {
        importApi = `${importApi}?${additionalParams}`;
      }

      axiosInstance()
        .post(apiUrl ? apiUrl : importApi, formData, {
          responseType: 'blob',
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          if (!response.headers['content-disposition']) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'All Records Added Successfully'
            });
          } else {
            const fileName = response.headers['content-disposition'].split('filename=')[1];
            downloadExcel(response.data, fileName);
            toastConfig.setToastConfig({
              open: true,
              type: 'error',
              message: `Found some issue(s) while importing ${module}`
            });
          }
          // handleExtraClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const exportToExcel = (apiUrl = null) => {
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Your file will be downloaded/uploaded in a matter of seconds`
    });
    let exportApi = `${api}/template?export=true` + '&refrenceId=' + refrenceId;
    if (additionalParams) {
      exportApi = `${exportApi}&${additionalParams}`;
    }

    if (recordsToExport > 0) {
      if (exportSelectedRecords) {
        exportSelectedRecords();
        return;
      }
      exportApi = exportApi + `&ids=${JSON.stringify(ids)}`;
    }

    axiosInstance()
      .get(apiUrl ? apiUrl : exportApi, {
        responseType: 'arraybuffer'
      })
      .then((response) => {
        const fileName = response.headers['content-disposition'].split('filename=')[1];
        downloadExcel(response.data, fileName);
        if (recordsToExport > 0) {
          onExportToExcelSuccess();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const downloadTemplate = () => {
    axiosInstance()
      .get(`${api}/template`, { responseType: 'arraybuffer' })
      .then((response) => {
        const fileName = response.headers['content-disposition'].split('filename=')[1];

        downloadExcel(response.data, fileName);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const RenderButtonMenu = () => {
    return (<Menu id="button-menu" anchorEl={imptExptDnldMenuDta.anchorEl} keepMounted open={true} onClose={handleCloseMenu}>
      {permissions?.isCreate && imptExptDnldMenuDta.action === 'import' && (
        <MenuItem
          onClick={() => {
            setIsSelection(true);
            setIsUploadDialog(true);
            handleCloseMenu();
          }}
        >
          <label htmlFor="importFromExcel" className="cursor-pointer">
            {api === 'product' ? `Product Import` : `Import from Excel`}
          </label>
        </MenuItem>
      )}
      {imptExptDnldMenuDta.action === 'export' && (
        <MenuItem
          onClick={() => {
            exportToExcel();
            handleCloseMenu();
          }}
        >
          {api === 'product' ? `Product Export` : `Export to Excel`}
        </MenuItem>
      )}
      {imptExptDnldMenuDta.action === 'download' && (
        <MenuItem
          onClick={() => {
            setIsSelection(true);
            handleCloseMenu();
          }}
        >
          {api === 'product' ? `Product Template` : ` Download Template`}
        </MenuItem>
      )}
      {extraImportExportLinks?.map((d) => {
        if (d.type === 'import' && imptExptDnldMenuDta.action === 'import') {
          return (
            <MenuItem key={d.title}>
              <input
                onClick={(e: any) => (e.target.value = null)}
                id="importFromExcel"
                name="importFromExcel"
                onChange={(e) => {
                  uploadExtraData(e, d.api);
                }}
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
              <label htmlFor="importFromExcel">{d.title}</label>
            </MenuItem>
          );
        } else if (d.type === 'export' && imptExptDnldMenuDta.action === 'export') {
          return (
            <MenuItem
              key={d.title}
              onClick={() => {
                exportToExcel(d.api);
                handleCloseMenu();
              }}
            >
              {d.title}
            </MenuItem>
          );
        } else if (imptExptDnldMenuDta.action === 'download' && d.type === 'download') {
          return (
            <MenuItem
              key={d.title}
              onClick={() => {
                exportToExcel(d.api);
                handleCloseMenu();
              }}
            >
              {d.title}
            </MenuItem>
          );
        }
      })}
    </Menu>

    );
  };

  return (
    <div className={module !== 'builder' ? classes.root : classes.custom_root}>
      <div className={classes.linksContainer}>
        {permissions?.isCreate && (
          <label
            onClick={(e) => {
              if (api === 'product') {
                handleOpenMenu(e, 'import');
              } else {
                setIsSelection(true);
                setIsUploadDialog(true);
                handleClose();
              }
            }}
            htmlFor={api === 'product' ? '' : 'importFromExcel'}
            className={`${module !== 'builder' ? classes.links : classes.custom_links} cursor-pointer new-headerbox-button-v1`}
          >
            Import from Excel
          </label>
        )}
        <label
          onClick={(e) => {
            if (api === 'product') {
              handleOpenMenu(e, 'export');
            } else {
              exportToExcel();
            }
          }}
          className={`${module !== 'builder' ? classes.links : classes.custom_links} cursor-pointer new-headerbox-button-v1`}
        >
          Export to Excel
          {isExportAllOrSomeFeature ? (recordsToExport === 0 || recordsToExport === total ? ' (All)' : ` (${recordsToExport})`) : null}
        </label>
        <label
          onClick={(e) => {
            if (api === 'product') {
              handleOpenMenu(e, 'download');
            } else {
              setIsSelection(true);
            }
          }}
          className={`${module !== 'builder' ? classes.links : classes.custom_links} cursor-pointer new-headerbox-button-v1`}
        >
          Download Template
        </label>
        {extraImportExportLinks?.length > 0 && api !== 'product' && (
          <>
            <Menu id="import-export-extra-links" anchorEl={anchorExtraEl} keepMounted open={Boolean(anchorExtraEl)} onClose={handleExtraClose}>
              {extraImportExportLinks?.map((d, idx) => {
                if (d.type === 'import') {
                  return (
                    <MenuItem>
                      <input
                        onClick={(e: any) => (e.target.value = null)}
                        id={`importDataFromExcel-${idx}`}
                        name={`importDataFromExcel-${idx}`}
                        onChange={(e) => {
                          uploadExtraData(e, d.api);
                        }}
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        style={{
                          opacity: '0',
                          position: 'absolute',
                          zIndex: -1
                        }}
                        type="file"
                      />
                      <label htmlFor={`importDataFromExcel-${idx}`}>{d.title}</label>
                    </MenuItem>
                  );
                } else {
                  return (
                    <MenuItem
                      onClick={() => {
                        exportToExcel(d.api);
                        handleExtraClose();
                      }}
                    >
                      {d.title}
                    </MenuItem>
                  );
                }
              })}
            </Menu>
            <Box ml={1} />
            <IconButton onClick={handleExtraClick}>
              <IoIosArrowDropdown className={module !== 'builder' ? classes.expandIcon : classes.custom_expandIcon} />
            </IconButton>
          </>
        )}
      </div>
      <Menu id="import-export-links" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        {permissions?.isCreate && (
          <MenuItem
            onClick={() => {
              setIsSelection(true);
              setIsUploadDialog(true);
              handleClose();
            }}
          >
            <label htmlFor="importFromExcel" className="cursor-pointer">
              Import from Excel
            </label>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            exportToExcel();
            handleClose();
          }}
        >
          Export to Excel
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsSelection(true);
            handleClose();
          }}
        >
          Download Template
        </MenuItem>

        {extraImportExportLinks?.map((d) => {
          if (d.type === 'import') {
            return (
              <MenuItem>
                <input
                  onClick={(e: any) => (e.target.value = null)}
                  id="importFromExcel"
                  name="importFromExcel"
                  onChange={(e) => {
                    uploadExtraData(e, d.api);
                  }}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  style={{
                    opacity: '0',
                    position: 'absolute',
                    zIndex: -1
                  }}
                  type="file"
                />
                <label htmlFor="importFromExcel">{d.title}</label>
              </MenuItem>
            );
          } else {
            return (
              <MenuItem
                onClick={() => {
                  exportToExcel(d.api);
                  handleExtraClose();
                }}
              >
                {d.title}
              </MenuItem>
            );
          }
        })}
      </Menu>
      {isMobile && (
        <IconButton onClick={handleClick}>
          <IoIosArrowDropdown className={module !== 'builder' ? classes.expandIcon : classes.custom_expandIcon} />
        </IconButton>
      )}
      {isSelection && (
        <SelectionDialog
          uploadData={uploadData}
          isUpload={isUpladDialog}
          refrenceId={refrenceId}
          handleClose={() => {
            setIsSelection(false);
            setIsSelection(false);
          }}
          api={api}
        />
      )}
      {imptExptDnldMenuDta.open && <RenderButtonMenu />}
    </div>
  );
}
