import { Menu, MenuItem, Theme, useMediaQuery } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Fragment, useContext, useMemo, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { downloadExcel, IMPORT_EXPORT_TYPE, sidebarResource } from '../../constants/helpers';
import { DownloadIcon, ExportIcon, ImportIcon } from 'src/assets/svg/svgIcons';
import ImportExportDialog from 'src/components/AsynImportExportMenu/ImportExportDialog';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  delBtn: {
    color: 'red'
  }
}));

export default function ImportExportLinks({
  ids = [],
  permissions,
  module,
  api,
  afterImportCompleted,
  recordsToExport = 0,
  isExportAllOrSomeFeature = false,
  onlyExport = false,
  onExportToExcelSuccess = () => { },
  total = 0,
  additionalParams = null,
  isDownloadExcel = true,
  isDropDownIconShow = false,
  extraImportExportLinks = [],
  title = '',
  headers = null,
  hideDefaultImportExport = false,
  small = false,
  visibleColumns = {},
  asyncExport = false,
  asyncImport = false,
  resource = null,
  hideDownloadTemplate = false
}) {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width: 960px)');

  const toastConfig = useContext(CustomToastContext);
  const [openAsyncImpExpDialog, setOpenAsyncImpExpDialog] = useState({ open: false, type: null, api: null });
  const [refresh, setRefresh] = useState(false);
  const [imptExptDnldMenuDta, setImptExptDnldMenuDta] = useState({ anchorEl: null, action: null, open: false });

  const exportColumn = useMemo(() => {
    const columns = [];
    for (const key in visibleColumns) {
      if (visibleColumns[key]) {
        columns.push(key);
      }
    }
    return columns;
  }, [visibleColumns]);

  const handleOpenMenu = (e, action) => {
    setImptExptDnldMenuDta({ action, anchorEl: e.currentTarget, open: true });
  };

  const handleCloseMenu = () => {
    setImptExptDnldMenuDta({ anchorEl: null, action: null, open: false });
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
        if (additionalParams?.includes('?')) {
          additionalParams = additionalParams?.replace(`?`, `&`);
        }
        importApi = `${importApi}?${additionalParams}`;
      }

      axiosInstance().post(apiUrl ? apiUrl : importApi, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(headers ? headers : {})
        }
      }).then((response) => {
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

  const exportToExcel = (apiUrl = null) => {

    if (recordsToExport > 200 && recordsToExport !== total) {
      toastConfig.setToastConfig({
        open: true,
        type: 'warning',
        message: 'A maximum of 200 records can be exported per selection.'
      });
      return
    }

    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Your file will be downloaded/uploaded in a matter of seconds`
    });

    let exportApi = apiUrl ? apiUrl : `${api}/template?export=true`;

    if (additionalParams) {
      if (exportApi?.includes('?') && additionalParams?.includes('?')) {
        additionalParams = additionalParams?.replace(`?`, `&`);
      }
      exportApi = `${exportApi}${additionalParams}`;
    }

    if (exportColumn.length > 0) {
      if (exportApi?.includes('?')) {
        exportApi = `${exportApi}&exportColumn=${JSON.stringify(exportColumn)}`;
      } else {
        exportApi = `${exportApi}?exportColumn=${JSON.stringify(exportColumn)}`;
      }
    }

    if (recordsToExport > 0 && recordsToExport !== total) {
      exportApi = exportApi + `&ids=${JSON.stringify(ids)}`;
    }

    axiosInstance().get(exportApi, {
      responseType: 'arraybuffer',
      headers: {
        ...(headers ? headers : {})
      }
    }).then((response) => {
      if (asyncExport && resource) {
        setRefresh(!refresh);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Export to excel added in queue successfully.'
        });
      } else {
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
      }
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const downloadTemplate = (apiUrl = null) => {
    let exportApi = apiUrl ? apiUrl : `${api}/template`;
    if (additionalParams) {
      if (exportApi?.includes('?') && additionalParams?.includes('?')) {
        additionalParams = additionalParams?.replace(`?`, `&`);
      }
      exportApi = `${exportApi}${additionalParams}`;
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
      onChange={(e) => {
        uploadData(e);
        handleCloseMenu();
      }}
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
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {permissions?.isCreate && imptExptDnldMenuDta.action === 'import' && !hideDefaultImportExport && (
          <MenuItem>
            {ImportInput}
            <label
              htmlFor={asyncImport && resource ? '' : 'importFromExcel'}
              className="cursor-pointer"
              onClick={() => {
                if (asyncImport && resource) {
                  setOpenAsyncImpExpDialog({ open: true, type: IMPORT_EXPORT_TYPE.import, api: null });
                  handleCloseMenu();
                }
              }}
            >
              <span>{title !== '' ? `${title} Import ` : `Import from Excel`}</span>
            </label>
          </MenuItem>
        )}
        {imptExptDnldMenuDta.action === 'export' && !hideDefaultImportExport && (
          <MenuItem
            onClick={() => {
              asyncExport && resource ? setOpenAsyncImpExpDialog({ open: true, type: IMPORT_EXPORT_TYPE.export, api: null }) : exportToExcel();
              handleCloseMenu();
            }}
          >
            {title !== '' ? `${title} Export` : `Export to Excel`}
            {recordsToExport === 0 ? ' (All)' : ` (${recordsToExport})`}
          </MenuItem>
        )}
        {imptExptDnldMenuDta.action === 'download' && !hideDefaultImportExport && (
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
                    handleCloseMenu();
                  }}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  style={{
                    opacity: '0',
                    position: 'absolute',
                    zIndex: -1
                  }}
                  type="file"
                />
                <label
                  htmlFor={asyncImport && resource ? '' : `${d.title}-${idx + 1}`.replace(/\s+/g, '')}
                  onClick={() => {
                    if (asyncImport && resource) {
                      setOpenAsyncImpExpDialog({ open: true, type: IMPORT_EXPORT_TYPE.import, api: d.api });
                      handleCloseMenu();
                    }
                  }}
                >
                  {d.title}
                </label>
              </MenuItem>
            );
          } else if (d.type === 'export' && imptExptDnldMenuDta.action === 'export') {
            return (
              <MenuItem
                key={d.title}
                onClick={() => {
                  asyncExport && resource
                    ? setOpenAsyncImpExpDialog({ open: true, type: IMPORT_EXPORT_TYPE.export, api: d.api })
                    : exportToExcel(d.api);
                  handleCloseMenu();
                }}
              >
                {d.title}
                {recordsToExport === 0 ? ' (All)' : ` (${recordsToExport})`}
              </MenuItem>
            );
          } else if (imptExptDnldMenuDta.action === 'download' && d.type === 'download') {
            return (
              <MenuItem
                key={d.title}
                onClick={() => {
                  if (resource === sidebarResource.rentalManagement) {
                    downloadTemplate(d.api);
                  } else {
                    exportToExcel(d.api);
                  }
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
    <div id="importExportLinks" className={!isDropDownIconShow && `${classes.root}`}>
      <div className={classes.linksContainer}>
        {ImportInput}
        {permissions?.isCreate && !onlyExport && (
          <Fragment>
            <label
              htmlFor={extraImportExportLinks.length > 0 || (asyncImport && resource) ? '' : 'importFromExcel'}
              onClick={(e) => {
                if (extraImportExportLinks.length > 0) {
                  handleOpenMenu(e, 'import');
                } else if (asyncImport && resource) {
                  setOpenAsyncImpExpDialog({ open: true, type: IMPORT_EXPORT_TYPE.import, api: null });
                }
              }}
              className={`new-headerbox-button-v1 ${small ? 'small' : ''}`}
            >
              {!isMobile && <span>Import from Excel</span>}
              <ImportIcon />
            </label>
          </Fragment>
        )}
        <Fragment>
          <label
            onClick={(e) => {
              if (extraImportExportLinks.length > 0) {
                handleOpenMenu(e, 'export');
              } else {
                asyncExport && resource ? setOpenAsyncImpExpDialog({ open: true, type: IMPORT_EXPORT_TYPE.export, api: null }) : exportToExcel();
              }
            }}
            className={`new-headerbox-button-v1 ${small ? 'small' : ''}`}
          >
            {!isMobile &&
              <span>
                Export to Excel{' '}
                {isExportAllOrSomeFeature ? (recordsToExport === 0 || recordsToExport === total ? '(All)' : `(${recordsToExport})`) : null}
              </span>}
            <ExportIcon />
          </label>
        </Fragment>
        {isDownloadExcel && !onlyExport && !hideDownloadTemplate && (
          <Fragment>
            <label
              onClick={(e) => {
                if (extraImportExportLinks.length > 0) {
                  handleOpenMenu(e, 'download');
                } else {
                  downloadTemplate();
                }
              }}
              className={`new-headerbox-button-v1 ${small ? 'small' : ''}`}
            >
              {!isMobile &&
                <span>Download Template</span>}
              <DownloadIcon />
            </label>
          </Fragment>
        )}
      </div>
      {imptExptDnldMenuDta.open && <RenderButtonMenu />}
      {openAsyncImpExpDialog.open && (
        <ImportExportDialog
          handleClose={() => {
            setOpenAsyncImpExpDialog({ open: false, type: null, api: null });
          }}
          type={openAsyncImpExpDialog.type}
          resource={resource}
          subResource={null}
          referenceId={null}
          handleExport={() => {
            exportToExcel(openAsyncImpExpDialog.api);
          }}
          refresh={refresh}
          api={api}
          apiUrl={openAsyncImpExpDialog.api}
          additionalParams={additionalParams}
        />
      )
      }
    </div >
  );
}
