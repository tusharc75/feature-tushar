import { Box, IconButton, Menu, MenuItem, Theme, useMediaQuery } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { isEmpty } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { IoIosArrowDropdown } from 'react-icons/io';
import { MdImportExport } from 'react-icons/md';
import { DownloadIcon, ExportIcon, ImportIcon } from 'src/assets/svg/svgIcons';
import { CustomImport } from 'src/components/productBuilder/CustomImport';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { downloadExcel } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import SelectionDialog from './SelectionDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ExpandMore } from '@mui/icons-material';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
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
  delBtn: {
    color: 'red'
  }
}));

export default function ImportExportLinks({
  ids = [],
  permission,
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
  extraImportExportLinks = [],
  inverted = false,
  small = false,
  isCustomImport = false,
  onSuccessCustomImport = () => { },
  currency = 'USD'
}) {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const toastConfig = useContext(CustomToastContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSelection, setIsSelection] = useState(false);
  const [isUpladDialog, setIsUploadDialog] = useState(false);
  const [anchorExtraEl, setAnchorExtraEl] = useState(null);
  const [customImportDialog, setCustomImportDialog] = useState(false);

  const [imptExptDnldMenuDta, setImptExptDnldMenuDta] = useState({ anchorEl: null, action: null, open: false });

  const {
    state: { permissions }
  }: any = useData();

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
    return (
      <Menu
        id="button-menu"
        anchorEl={imptExptDnldMenuDta.anchorEl}
        keepMounted
        open={true}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {permission?.isCreate && imptExptDnldMenuDta.action === 'import' && (
          <MenuItem
            onClick={() => {
              setIsSelection(true);
              setIsUploadDialog(true);
              handleCloseMenu();
            }}
          >
            <label htmlFor="importFromExcel">{api === 'product' ? `Product Import` : `Import from Excel`}</label>
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
        {extraImportExportLinks?.map((d, idx) => {
          if (d.type === 'import' && imptExptDnldMenuDta.action === 'import') {
            return (
              <MenuItem key={d.title}>
                <input
                  onClick={(e: any) => (e.target.value = null)}
                  id={`${d.title}-${idx + 1}`.replace(/\s+/g, '')}
                  name={`${d.title}-${idx + 1}`.replace(/\s+/g, '')}
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
                <label htmlFor={`${d.title}-${idx + 1}`.replace(/\s+/g, '')}>{d.title}</label>
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

  const handleDownloadTemplate = () => {
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

  const ImportInput = (
    <input
      onClick={(e: any) => (e.target.value = null)}
      id="importFromExcel"
      name="importFromExcel"
      onChange={uploadData}
      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      style={{
        opacity: '0',
        position: 'absolute',
        zIndex: -1
      }}
      type="file"
    />
  );

  return (
    <div
      className={`${module !== 'builder' ? classes.root : classes.custom_root} ${small ? '[padding-right:0_!important]' : ''} ${inverted ? 'inverted' : ''}`}
    >
      {!isCustomImport ? (
        <div className={classes.linksContainer}>
          {permission?.isCreate &&
            (permissions?.productCategory?.isRead ? (
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
                className={`new-headerbox-button-v1 ${small ? 'small' : ''}`}
              >
                Import from Excel
                <ImportIcon />
              </label>
            ) : (
              <>
                {ImportInput}
                <label htmlFor="importFromExcel" className={`new-headerbox-button-v1 ${small ? 'small' : ''}`}>
                  <span>Import from Excel</span>
                </label>
              </>
            ))}
          <label
            onClick={(e) => {
              if (api === 'product') {
                handleOpenMenu(e, 'export');
              } else {
                exportToExcel();
              }
            }}
            className={` new-headerbox-button-v1 ${small ? 'small' : ''}`}
          >
            Export to Excel
            {isExportAllOrSomeFeature ? (recordsToExport === 0 || recordsToExport === total ? ' (All)' : ` (${recordsToExport})`) : null}
            <ExportIcon />
          </label>
          <label
            onClick={(e) => {
              if (api === 'product') {
                handleOpenMenu(e, 'download');
              } else {
                if (permissions?.productCategory?.isRead) {
                  setIsSelection(true);
                } else {
                  handleDownloadTemplate();
                }
              }
            }}
            className={`new-headerbox-button-v1 ${small ? 'small' : ''}`}
          >
            Download Template
            <DownloadIcon />
          </label>
          {extraImportExportLinks?.length > 0 && api !== 'product' && (
            <>
              <Menu
                id="import-export-extra-links"
                anchorEl={anchorExtraEl}
                keepMounted
                open={Boolean(anchorExtraEl)}
                onClose={handleExtraClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                {extraImportExportLinks?.map((d, idx) => {
                  if (d.type === 'import') {
                    return (
                      <MenuItem>
                        <input
                          onClick={(e: any) => (e.target.value = null)}
                          id={`${d.title}-${idx + 2}`.replace(/\s+/g, '')}
                          name={`${d.title}-${idx + 2}`.replace(/\s+/g, '')}
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
                        <label htmlFor={`${d.title}-${idx + 2}`.replace(/\s+/g, '')}>{d.title}</label>
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
              <IconButton onClick={handleExtraClick} className={`expand-icon-v1`} style={{ padding: '3px' }}>
                <IoIosArrowDropdown />
              </IconButton>
            </>
          )}
        </div>
      ) : (
        <ThemeButton
          onClick={(e) => handleClick(e)}
          endIcon={<ExpandMore />}
          mobileTooltip='Import/Export'
          iconForMobile={<MdImportExport size={20} />}
        >
          Import/Export
        </ThemeButton>
      )}
      {isMobile && (
        <IconButton onClick={handleClick} className={`expand-icon-v1`} style={{ padding: '3px' }}>
          <IoIosArrowDropdown />
        </IconButton>
      )}

      <Menu
        id="import-export-links"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {permission?.isCreate &&
          (permissions?.productCategory?.isRead ? (
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
          ) : (
            <MenuItem>
              {ImportInput}
              <label htmlFor="importFromExcel" className="cursor-pointer">
                Import from Excel
              </label>
            </MenuItem>
          ))}
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
            if (permissions?.productCategory?.isRead) {
              setIsSelection(true);
            } else {
              handleDownloadTemplate();
            }
            handleClose();
          }}
        >
          Download Template
        </MenuItem>
        {isCustomImport && permission?.isUpdate && (
          <MenuItem
            onClick={() => {
              setCustomImportDialog(true);
              handleClose();
            }}
          >
            Custom Import
          </MenuItem>
        )}
        {extraImportExportLinks?.map((d, idx) => {
          if (d.type === 'import') {
            return (
              <MenuItem>
                <input
                  onClick={(e: any) => (e.target.value = null)}
                  id={`${d.title}-${idx + 3}`.replace(/\s+/g, '')}
                  name={`${d.title}-${idx + 3}`.replace(/\s+/g, '')}
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
                <label htmlFor={`${d.title}-${idx + 3}`.replace(/\s+/g, '')}>{d.title}</label>
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
      {isSelection && (
        <SelectionDialog
          uploadData={uploadData}
          isUpload={isUpladDialog}
          refrenceId={refrenceId}
          handleClose={() => {
            setIsSelection(false);
          }}
          api={api}
        />
      )}
      {customImportDialog && (
        <CustomImport
          handleClose={() => {
            setCustomImportDialog(false);
          }}
          onSuccess={() => {
            setCustomImportDialog(false);
            onSuccessCustomImport();
          }}
          refrenceId={refrenceId}
          currency={currency}
        />
      )}
      {imptExptDnldMenuDta.open && <RenderButtonMenu />}
    </div>
  );
}
