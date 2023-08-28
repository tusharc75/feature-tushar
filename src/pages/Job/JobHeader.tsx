import { useState } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined } from '@material-ui/icons';
import { Box, Grid, MenuItem, Button, Menu, IconButton } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import { isMobile, isTablet } from 'react-device-detect';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { MdAdd, MdSort, MdFilterList } from 'react-icons/md';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import AppsIcon from '@material-ui/icons/Apps';
import ViewListIcon from '@material-ui/icons/ViewList';

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
    setViewType
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
        {isMobile && (
          <div className="d-flex flex-wrap items-center justify-between w-full">
            <div>{toggleInner}</div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                variant="text"
                disableElevation
                startIcon={<MdSort />}
                className={'sort-filter-tablet'}
                style={isTablet ? { marginLeft: '50px' } : {}}
              >
                Sort
              </Button>

              <MobileSortDialog
                isOpen={open}
                handleClose={handleClickClose}
                contentPart={toggleInner}
                secHeading={['Sort Job']}
                columns={columns}
                dispatch={dispatch}
              />

              <Button
                onClick={handleOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                variant="text"
                disableElevation
                className={'sort-filter-tablet'}
                startIcon={<MdFilterList />}
              >
                Filter
              </Button>
              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleClose}
                contentPart={null}
                columns={columns}
                dispatch={dispatch}
                title={routes?.job?.title}
                filters={filters}
              />
            </div>
          </div>
        )}

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
    </div>
  );
}

export default JobHeader;
