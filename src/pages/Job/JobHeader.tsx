import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import AppsIcon from '@material-ui/icons/Apps';
import ViewListIcon from '@material-ui/icons/ViewList';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { TbArrowsSort } from 'react-icons/tb';
import { useHistory } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';

function JobHeader(props) {
  const {
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    permissions,
    showConfirmBox,
    canDelete,
    children,
    selectedType,
    columns,
    dispatch,
    filters,
    viewType,
    setViewType,
    resource = ''
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const history = useHistory();

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  let toggleInner = options && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={options[selectedType - 1].key} exclusive onChange={handleFilter}>
      {options.map((k, index) => {
        return (
          <ToggleButton value={k.key} key={index}>
            {k.key}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={'d-flex align-items-center gap-1 flex-wrap'}>
        {options && (
          <ToggleButtonGroup
            size="small"
            className="align-items-center gap-1 layout-for-mobile "
            value={options[selectedType - 1].key}
            exclusive
            onChange={handleFilter}
          >
            {options.map((k, index) => {
              return (
                <ToggleButton value={k.key} key={index}>
                  {k.key}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        )}
        {permissions?.fleetDispatch?.isRead && (
          <Box>
            <ToggleButtonGroup size="small">
              <ToggleButton
                onClick={() => {
                  history.push(`${routes.fleetDispatch.path}`);
                }}
              >
                <span>{routes.fleetDispatch.title}</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        {permissions?.fleetReceiver?.isRead && (
          <Box>
            <ToggleButtonGroup size="small">
              <ToggleButton
                onClick={() => {
                  history.push(`${routes.fleetReceiver.path}`);
                }}
              >
                <span>{routes.fleetReceiver.title}</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        <Box>
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setViewType(1);
            }}
          >
            <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setViewType(2);
            }}
          >
            <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
          </IconButton>
        </Box>
        {children}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end items-start">
        <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />

        <div className="flex gap-[8px] flex-wrap items-center">
          {permissions?.job?.isCreate && permissions?.job?.isUpdate && (
            <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={'no-shadow'} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}
          {permissions?.job?.isDelete && (
            <>
              <Button
                disabled={canDelete}
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                className={`new-dropdown-v1`}
                endIcon={<ExpandMore />}
              >
                Actions
              </Button>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="action-menu"
                open={Boolean(anchorEl)}
                onClose={closeActions}
              >
                <MenuItem
                  onClick={() => {
                    closeActions();
                    showConfirmBox(null);
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </div>
      <DisplayFiltersForMobile resource={resource} />
    </div>
  );
}

export default JobHeader;
