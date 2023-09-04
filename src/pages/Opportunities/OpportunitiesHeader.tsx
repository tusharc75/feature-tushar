import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import routes from 'src/components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import styles from '../Leads/Header.module.scss';

function OpportunitiesHeader(props) {
  const ref = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    opportunityPermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog,
    columns,
    dispatch,
    filters,
    selectedType,
    resource = ''
  } = props;

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      // If the menu is open and the clicked target is not within the menu,
      // then close the menu
      if (isMenuOpen && ref.current && !ref.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', checkIfClickedOutside);

    return () => {
      // Cleanup the event listener
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [isMenuOpen]);

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      onTypeChange(options.find((d) => d.key === newFilter).value);
      handleClose();
    }
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
      <div className={'d-flex align-items-center gap-1'}>
        {isMobile && !isTablet ? (
          <div className="d-flex flex-wrap items-center justify-between w-full">
            <div>{toggleInner}</div>
            <div className="flex flex-wrap items-center gap-1">
              <IconButton
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                className={'mobileIconButton secondary'}
                size="small"
              >
                <TbArrowsSort className="rotate-90" size={16} />
              </IconButton>

              <MobileSortDialog
                isOpen={open}
                handleClose={handleClickClose}
                contentPart={toggleInner}
                secHeading={['Sort Opportunities']}
                columns={columns}
                dispatch={dispatch}
              />

              <IconButton
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                className={'mobileIconButton secondary'}
                size="small"
                onClick={handleOpen}
              >
                <MdOutlineFilterAlt size={16} />
              </IconButton>
              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleClose}
                contentPart={''}
                columns={columns}
                dispatch={dispatch}
                title={routes?.opportunity?.title}
                filters={filters}
                resource={resource}
              />
            </div>
          </div>
        ) : (
          options && (
            <ToggleButtonGroup size="small" className="ml-2" value={options[selectedType - 1].key} exclusive onChange={handleFilter}>
              {options.map((k, index) => {
                return (
                  <ToggleButton value={k.key} key={index}>
                    {k.key}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          )
        )}

        {children}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />
        <div className="flex gap-[8px] flex-wrap items-center">
          {opportunityPermissions.isCreate && opportunityPermissions.isUpdate && (
            <Button variant={'contained'} color="primary" size="small" className={'no-shadow'} onClick={onCreate} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}
          {(opportunityPermissions.isDelete || opportunityPermissions.isUpdate) && (
            <>
              <Button
                disabled={canDelete}
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                className={`new-dropdown-v1`}
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
                  onClick={() => {
                    closeActions();
                    showConfirmBox(null);
                  }}
                >
                  Delete
                </MenuItem>
                <MenuItem
                  disabled={selectedRecords.find((d) => d.canDelete === false)}
                  onClick={() => {
                    closeActions();
                    showTransferEntityDialog();
                  }}
                >
                  Transfer Entity
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
export default OpportunitiesHeader;
