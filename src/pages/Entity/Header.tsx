import { Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { BiNetworkChart } from 'react-icons/bi';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import styles from '../Leads/Header.module.scss';

const EntityHeader = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    entityPermissions,
    openUserDialog,
    anyEntitySelected,
    selectedRecords = [],
    manageDeleteEntity,
    canDelete,
    columns,
    dispatch,
    filters,
    resource
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [showDeleteEntityDialog, setShowDeleteEntityDialog] = useState(null);

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
        <div className="d-flex align-items-center">
          <BiNetworkChart className="headerLogo" />
          <span className="listingHeader">{routes.entity.title}</span>
        </div>
        {isMobile && (
          <div className="d-flex flex-wrap items-center justify-between w-full">
            <div className="flex gap-1 ml-auto">
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
                secHeading={['Sort Entity']}
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
                title={routes?.entity?.title}
                filters={filters}
                resource={resource}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} value={searchVal} className={styles.search_box_input} size="small" />

        <div className="flex gap-[8px] flex-wrap items-center">
          {entityPermissions?.isCreate && (
            <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={`no-shadow`} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}
          {entityPermissions?.isUpdate ? (
            <>
              <Button
                className={`new-dropdown-v1`}
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedRecords?.length ? false : true}
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
                {entityPermissions?.isDelete && (
                  <MenuItem
                    disabled={selectedRecords.length > 1 ? true : Boolean(!canDelete) ? true : false}
                    onClick={() => {
                      manageDeleteEntity();
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
                {entityPermissions?.isUpdate && (
                  <MenuItem
                    disabled={!anyEntitySelected}
                    onClick={() => {
                      openUserDialog();
                      closeActions();
                    }}
                  >
                    Assign User
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : null}
        </div>
      </div>
      <DisplayFiltersForMobile resource={resource} />
    </div>
  );
};

export default EntityHeader;
