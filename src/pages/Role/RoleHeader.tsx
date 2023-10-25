import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { useState } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';

import { isMobile } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { useData } from '../../StateProvider/Provider';
import routes from '../../components/Helpers/Routes';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import { localStorageKeys } from '../../constants/helpers';
import styles from '../Leads/Header.module.scss';

const RoleHeader = (props) => {
  const {
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    rolePermissions,
    showConfirmBox,
    canDelete,
    selectedRecords,
    userDialogOpen,
    columns,
    dispatch,
    filters,
    resource,
    updateResourceOpen
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState(
    localStorage.getItem(localStorageKeys.currentSelectedRoleType) ? localStorage.getItem(localStorageKeys.currentSelectedRoleType) : 'Global'
  );
  const [sortOpen, setSortOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const {
    state: { selectedEntity }
  }: any = useData();

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
      localStorage.setItem('currentSelectedRoleType', newFilter);
    }
  };
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClickOpen = () => {
    setSortOpen(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  const handleFilterClose = () => {
    setisOpenDialog(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={'d-flex align-items-center gap-1'}>
        {isMobile && (
          <div className="d-flex flex-wrap items-center justify-between w-full">
            <div></div>
            <div className="flex flex-wrap items-center gap-1 ml-auto">
              <IconButton
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={'true'}
                className={'mobileIconButton secondary'}
                size="small"
              >
                <TbArrowsSort className="rotate-90" size={16} />
              </IconButton>
              <MobileSortDialog
                isOpen={sortOpen}
                handleClose={handleClickClose}
                contentPart={null}
                secHeading={['Sort Roles']}
                columns={columns}
                dispatch={dispatch}
              />

              <IconButton
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={'true'}
                className={'mobileIconButton secondary'}
                size="small"
                onClick={handleOpen}
              >
                <MdOutlineFilterAlt size={16} />
              </IconButton>

              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleFilterClose}
                contentPart={null}
                columns={columns}
                dispatch={dispatch}
                title={routes?.role?.title}
                filters={filters}
                resource={resource}
              />
            </div>
          </div>
        )}

        {/* {options && (
          <ToggleButtonGroup
            size="small"
            value={filter}
            exclusive
            onChange={handleFilter}
          >
            {options.map((k, index) => {
              return (
                <ToggleButton value={k.key} key={index}>
                  {k.key === "Global" ? "Company wide role" : "Region wide functional role"}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        )} */}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />

        <div className="flex gap-[8px] flex-wrap items-center">
          {rolePermissions.isCreate && (filter === 'Global' || (filter === 'Regional' && selectedEntity)) && (
            <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={`no-shadow`} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}

          {(rolePermissions.isDelete || rolePermissions.isUpdate) && (
            <>
              <Button
                disabled={selectedRecords.length === 0}
                className={`new-dropdown-v1`}
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
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
                  disabled={Boolean(!canDelete)}
                  onClick={() => {
                    closeActions();
                    showConfirmBox(null);
                  }}
                >
                  Delete
                </MenuItem>
                <MenuItem
                  disabled={!rolePermissions.isUpdate}
                  onClick={() => {
                    closeActions();
                    userDialogOpen();
                  }}
                >
                  Assign users
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeActions();
                    updateResourceOpen({action:"Assign"});
                  }}
                >
                  Assign Resource
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeActions();
                    updateResourceOpen({action:"Remove"});
                  }}
                >
                  Remove Resource
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </div>
      <DisplayFiltersForMobile resource={resource} />
    </div>
  );
};

export default RoleHeader;
