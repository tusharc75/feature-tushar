import React, { useContext, useState } from 'react';
import { Menu, MenuItem, Button, useMediaQuery } from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import { downloadExcel } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { MdImportExport } from 'react-icons/md';
import HtmlTooltip from '../CustomTooltipTitle';

const ImportExportMenu = ({
  ids = [],
  permissions,
  module,
  api,
  afterImportCompleted,
  recordsToExport = 0,
  exportSelectedRecords = null,
  isExportAllOrSomeFeature = false,
  onlyExport = false,
  onExportToExcelSuccess = () => { },
  total = 0,
  additionalParams = null,
  isDownloadExcel = true,
  title = '',
  ...others
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');

  const toastConfig = useContext(CustomToastContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const uploadData = (event) => {
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
        .post(importApi, formData, {
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
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const exportToExcel = () => {
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
      .get(exportApi, {
        responseType: 'arraybuffer'
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

  const downloadTemplate = () => {
    let exportApi = `${api}/template`;

    if (additionalParams) {
      exportApi = `${exportApi}?${additionalParams}`;
    }

    axiosInstance()
      .get(exportApi, { responseType: 'arraybuffer' })
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
      id="importFromExcelMenu"
      name="importFromExcelMenu"
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
    <>
      <HtmlTooltip title={<>Import/Export {title}</>} placement="top" arrow enterTouchDelay={0}>
        <span>
          <Button
            onClick={(e) => handleClick(e)}
            endIcon={<ArrowDropDownIcon />}
            variant={'outlined'}
            color="primary"
            aria-controls="simple-menu"
            aria-haspopup="true"
            className="min-h-[32px]"
            size="small"
            {...others}
          >
            {isMobile ? (
              <>
                <MdImportExport size={20} />
                {` ${title}`}
              </>
            ) : (
              <>Import/Export {title}</>
            )}
          </Button>
        </span>
      </HtmlTooltip>
      <Menu
        id="import-export-links"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
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
            <label htmlFor="importFromExcelMenu" style={{ cursor: 'pointer' }}>
              {ImportInput}
              Import from Excel
            </label>
          </MenuItem>
        )}
        {permissions?.isRead && (
          <MenuItem
            onClick={() => {
              exportToExcel();
              handleClose();
            }}
          >
            Export to Excel{' '}
            {isExportAllOrSomeFeature ? (recordsToExport === 0 || recordsToExport === total ? '(All)' : `(${recordsToExport})`) : null}
          </MenuItem>
        )}
        {isDownloadExcel && !onlyExport && (
          <MenuItem
            onClick={() => {
              downloadTemplate();
              handleClose();
            }}
          >
            Download Template
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ImportExportMenu;
