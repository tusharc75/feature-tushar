import React, { useContext, useEffect, useState } from 'react';
import { Divider, IconButton, makeStyles, useMediaQuery, Menu, MenuItem, Button } from '@material-ui/core';
import { IoIosArrowDropdown } from 'react-icons/io';
import axiosInstance from '../../axios/axiosInstance';
import { downloadExcel } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const useStyles = makeStyles((theme) => ({
  root: {
    // width: '100%',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ['@media (max-width: 960px)']: {
      display: 'none'
    }
  },
  // links: {
  //   color: theme.palette.info.light, //  textDark
  //   fontSize: 15
  // },
  // darkLinks: {
  //   color: theme.palette.info.dark, //  textDark
  //   fontSize: 15
  // },
  // linkDivider: {
  //   backgroundColor: '#ffffff42', //  darkBg
  //   margin: '0 10px'
  // },
  // darkLinkDivider: {
  //   backgroundColor: 'grey', //  darkBg
  //   margin: '0 10px'
  // },
  delBtn: {
    color: 'red'
  }
  // expandIcon: {
  //   position: 'absolute',
  //   right: '0',
  //   color: 'white'
  // },
  // darkExpandIcon: {
  //   position: 'absolute',
  //   right: '0',
  //   color: theme.palette.info.dark
  // }
}));

export default function ImportExportLinks({
  ids = [],
  permissions,
  module,
  api,
  afterImportCompleted,
  recordsToExport = 0,
  exportSelectedRecords = null,
  isExportAllOrSomeFeature = false,
  onlyExport = false,
  onExportToExcelSuccess = () => {},
  total = 0,
  additionalParams = null,
  isDownloadExcel = true,
  isBackgroundWhite = false,
  isDropDownIconShow = false,
  extraImportExportLinks = [],
  title = '',
  headers = null
}) {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width: 960px)');

  const toastConfig = useContext(CustomToastContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
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

  const handleClose = () => {
    setAnchorEl(null);
  };

  const uploadData = (event, apiUrl = null) => {
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
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(headers ? headers : {})
          }
        })
        .then((response) => {
          if (!response.headers['content-disposition']) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'All Records Added Successfully'
            });
            afterImportCompleted();
          } else {
            const fileName = response.headers['content-disposition'].split('filename=')[1];
            downloadExcel(response.data, fileName);
            toastConfig.setToastConfig({
              open: true,
              type: 'error',
              message: `Found some issue(s) while importing ${module}`
            });
            afterImportCompleted();
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * EXPORT TABLES INTO EXCEL
   */
  const exportToExcel = (apiUrl = null) => {
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Your file will be downloaded/uploaded in a matter of seconds`
    });
    let exportApi = `${api}/template?export=true`;

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
        responseType: 'arraybuffer',
        headers: {
          ...(headers ? headers : {})
        }
      })
      .then((response) => {
        const fileName = response.headers['content-disposition'].split('filename=')[1];
        downloadExcel(response.data, fileName);

        if (recordsToExport > 0) {
          onExportToExcelSuccess();
        }
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Exported to excel successfully.'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  /**
   * DOWNLOAD TEMPLATE
   */
  const downloadTemplate = () => {
    let exportApi = `${api}/template`;

    if (additionalParams) {
      exportApi = `${exportApi}?${additionalParams}`;
    }

    axiosInstance()
      .get(exportApi, { responseType: 'arraybuffer', headers: { ...(headers ? headers : {}) } })
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

  const RenderButtonMenu = () => {
    return (
      <Menu
        id="button-menu"
        anchorEl={imptExptDnldMenuDta.anchorEl}
        keepMounted
        open={true}
        onClose={handleCloseMenu}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {permissions?.isCreate && imptExptDnldMenuDta.action === 'import' && (
          <MenuItem>
            <label htmlFor="importFromExcel" className="cursor-pointer">
              {title !== '' ? `${title} Import ` : `Import from Excel`}
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
            {title !== '' ? `${title} Export` : `Export to Excel`}
            {recordsToExport === 0 ? ' (All)' : ` (${recordsToExport})`}
          </MenuItem>
        )}
        {imptExptDnldMenuDta.action === 'download' && (
          <MenuItem
            onClick={() => {
              downloadTemplate();
              handleCloseMenu();
            }}
          >
            {title !== '' ? `${title} Template` : `Download Template`}
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
                    uploadData(e, d.api);
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

  const RenderMobileMenu = () => {
    return (
      <>
        <Menu
          id="import-export-links"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
        >
          {permissions?.isCreate && !onlyExport && (
            <MenuItem>
              <label htmlFor="importFromExcel">{title !== '' ? `Import ${title}` : `Import from Excel`}</label>
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              exportToExcel();
              handleClose();
            }}
          >
            {title !== '' ? `Export ${title}` : `Export to Excel`}({recordsToExport === 0 ? 'All' : `(${recordsToExport})`})
          </MenuItem>
          {isDownloadExcel && !onlyExport && (
            <MenuItem
              onClick={() => {
                downloadTemplate();
                handleClose();
              }}
            >
              {title !== '' ? `${title} Template` : `Download Template`}
            </MenuItem>
          )}
          {extraImportExportLinks?.map((d, idx) => {
            if (d.type === 'import') {
              return (
                <MenuItem>
                  <input
                    onClick={(e: any) => (e.target.value = null)}
                    id={`${d.title}-${idx + 2}`.replace(/\s+/g, '')}
                    name={`${d.title}-${idx + 2}`.replace(/\s+/g, '')}
                    onChange={(e) => {
                      uploadData(e, d.api);
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
                    handleClose();
                  }}
                >
                  {d.title}
                </MenuItem>
              );
            }
          })}
        </Menu>
      </>
    );
  };

  return (
    <div id="importExportLinks" className={!isDropDownIconShow && `${classes.root}`}>
      {!isMobile && (
        <div className={classes.linksContainer}>
          {ImportInput}
          {permissions?.isCreate && !onlyExport && (
            <>
              <label
                htmlFor={extraImportExportLinks.length > 0 ? '' : 'importFromExcel'}
                onClick={(e) => {
                  if (extraImportExportLinks.length > 0) {
                    handleOpenMenu(e, 'import');
                  }
                }}
                className={`new-headerbox-button-v1`}
              >
                {/* {extraImportExportLinks.length > 0 || ImportInput} */}
                Import from Excel
              </label>
              {/* <Divider orientation="vertical" flexItem className={isBackgroundWhite ? classes.darkLinkDivider : classes.linkDivider} /> */}
            </>
          )}
          <label
            onClick={(e) => {
              if (extraImportExportLinks.length > 0) {
                handleOpenMenu(e, 'export');
              } else {
                exportToExcel();
              }
            }}
            className={`new-headerbox-button-v1`}
          >
            Export to Excel{' '}
            {isExportAllOrSomeFeature ? (recordsToExport === 0 || recordsToExport === total ? '(All)' : `(${recordsToExport})`) : null}
          </label>
          {isDownloadExcel && !onlyExport && (
            <>
              {/* <Divider orientation="vertical" flexItem className={isBackgroundWhite ? classes.darkLinkDivider : classes.linkDivider} /> */}
              <label
                onClick={(e) => {
                  if (extraImportExportLinks.length > 0) {
                    handleOpenMenu(e, 'download');
                  } else {
                    downloadTemplate();
                  }
                }}
                className={`new-headerbox-button-v1`}
              >
                Download Template
              </label>
            </>
          )}
        </div>
      )}
      {isMobile && (
        <>
          <RenderMobileMenu />
          <IconButton onClick={handleClick} className={`expand-icon-v1`} style={{ padding: '3px' }}>
            <IoIosArrowDropdown />
          </IconButton>
        </>
      )}
      {imptExptDnldMenuDta.open && <RenderButtonMenu />}
    </div>
  );
}
