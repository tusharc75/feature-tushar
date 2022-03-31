import React, { useContext, useState } from 'react';
import { Divider, IconButton, makeStyles, useMediaQuery, Menu, MenuItem } from '@material-ui/core';
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
    color: 'white'
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
  onExportToExcelSuccess = () => {},
  total = 0,
  additionalParams = null
}) {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const toastConfig = useContext(CustomToastContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSelection, setIsSelection] = useState(false);
  const [isUpladDialog, setIsUploadDialog] = useState(false);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
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

  /**
   * EXPORT TABLES INTO EXCEL
   */
  const exportToExcel = () => {
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
      .get(exportApi, {
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

  /**
   * DOWNLOAD TEMPLATE
   */
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

  return (
    <div className={module !== 'builder' ? classes.root : classes.custom_root}>
      <div className={classes.linksContainer}>
        {permissions?.isCreate && (
          <>
            <label
              onClick={() => {
                setIsSelection(true);
                setIsUploadDialog(true);
                handleClose();
              }}
              htmlFor="importFromExcel"
              className={`${module !== 'builder' ? classes.links : classes.custom_links} cursor-pointer`}
            >
              {/* {ImportInput} */}
              Import from Excel
            </label>
            <Divider orientation="vertical" flexItem className={classes.linkDivider} />
          </>
        )}
        <label onClick={exportToExcel} className={`${module !== 'builder' ? classes.links : classes.custom_links} cursor-pointer`}>
          Export to Excel
          {isExportAllOrSomeFeature ? (recordsToExport === 0 || recordsToExport === total ? ' (All)' : ` (${recordsToExport})`) : null}
        </label>
        <Divider orientation="vertical" flexItem className={classes.linkDivider} />
        <label onClick={() => setIsSelection(true)} className={`${module !== 'builder' ? classes.links : classes.custom_links} cursor-pointer`}>
          Download Template
        </label>
        {/* <Divider
          orientation="vertical"
          flexItem
          className={classes.linkDivider}
        />
        <label
          onClick={(e) => e.preventDefault()}
          className={`${classes.links} cursor-pointer`}
        >
          Email a Link
        </label> */}
      </div>
      <Menu id="import-export-links" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            setIsSelection(true);
            setIsUploadDialog(true);
            handleClose();
          }}
        >
          <label htmlFor="importFromExcel" className="cursor-pointer">
            {/* {ImportInput} */}
            Import from Excel
          </label>
        </MenuItem>
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
        {/* <MenuItem>Email a Link</MenuItem> */}
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
    </div>
  );
}
