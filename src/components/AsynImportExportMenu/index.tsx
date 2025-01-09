import { useContext, useState } from 'react';
import { Menu, MenuItem, useMediaQuery } from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import { IMPORT_EXPORT_TYPE, downloadExcel } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { MdImportExport } from 'react-icons/md';
import HtmlTooltip from '../CustomTooltipTitle';
import ImportExportDialog from './ImportExportDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ExpandMore } from '@mui/icons-material';

const AsynImportExportMenu = ({
  ids = [],
  permissions,
  module,
  api,
  afterImportCompleted,
  resource,
  subResource = null,
  referenceId = null,
  isExportCount = false,
  exportCount = 0,
  total = 0,
  additionalParams = null,
  title = '',
  onlyExport = false
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');

  const toastConfig = useContext(CustomToastContext);

  const [anchorEl, setAnchorEl] = useState(null);

  const [dialog, setDialog] = useState({ open: false, type: null });
  const [refresh, setRefresh] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = () => {
    let exportApi;
    if (onlyExport) {
      exportApi = `${api}/export`;
      if (additionalParams) {
        exportApi = `${exportApi}${additionalParams}`;
      }
    } else {
      exportApi = `${api}/template?export=true`;
      if (additionalParams) {
        exportApi = `${exportApi}&${additionalParams}`;
      }
    }
    if (exportCount > 0) {
      exportApi = exportApi + `&ids=${JSON.stringify(ids)}`;
    }
    axiosInstance()
      .get(exportApi)
      .then((response) => {
        setRefresh(!refresh);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Export to excel added in queue successfully.'
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

  return (
    <>
      <HtmlTooltip title={<>Import/Export {title}</>} placement="top" arrow enterTouchDelay={0}>
        <span>
          {onlyExport ? (
            <ThemeButton
              onClick={() => {
                setDialog({ open: true, type: IMPORT_EXPORT_TYPE.export });
              }}
            >
              Export All
            </ThemeButton>
          ) : (
            <ThemeButton
              onClick={(e) => handleClick(e)}
              endIcon={<ExpandMore />}
              buttonType="default"
              aria-controls="simple-menu"
              aria-haspopup="true"
            >
              {isMobile ? (
                <>
                  <MdImportExport size={20} />
                  {` ${title}`}
                </>
              ) : (
                <>Import/Export {title}</>
              )}
            </ThemeButton>
          )}
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
        {permissions?.isCreate && (
          <MenuItem
            onClick={() => {
              setDialog({ open: true, type: IMPORT_EXPORT_TYPE.import });
              handleClose();
            }}
          >
            Import from Excel
          </MenuItem>
        )}
        {permissions?.isRead && (
          <MenuItem
            onClick={() => {
              setDialog({ open: true, type: IMPORT_EXPORT_TYPE.export });
              handleClose();
            }}
          >
            Export to Excel {isExportCount ? (exportCount === 0 || exportCount === total ? '(All)' : `(${exportCount})`) : null}
          </MenuItem>
        )}
        {permissions?.isCreate && (
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
      {dialog.open && (
        <ImportExportDialog
          handleClose={() => {
            if (dialog.type === IMPORT_EXPORT_TYPE.import) {
              afterImportCompleted();
            }
            setDialog({ open: false, type: null });
            setAnchorEl(null);
          }}
          type={dialog.type}
          resource={resource}
          subResource={subResource}
          referenceId={referenceId}
          handleExport={handleExport}
          refresh={refresh}
          api={api}
          additionalParams={additionalParams}
        />
      )}
    </>
  );
};

export default AsynImportExportMenu;
