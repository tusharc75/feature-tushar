import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import Chip from '@material-ui/core/Chip';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { BiNetworkChart } from 'react-icons/bi';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';

import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';

const ProjectStrategyHeader = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    permissions,
    showConfirmBox,
    canDelete,
    handleFilterChange,
    selectedType,
    selectedRecords = [],
    setShowDeleteWarningConfirmBox,
    setShowEntityDialog,
    setEntities,
    columns,
    dispatch,
    children,
    filters
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      handleFilterChange(newFilter);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  let toggleInner = (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={selectedType} exclusive onChange={handleFilter}>
      <ToggleButton value={1}>My Projects</ToggleButton>
      <ToggleButton value={2}>All Projects</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={'d-flex align-items-center gap-1'}>
        <div className="d-flex align-items-center">
          <BiNetworkChart className="headerLogo" />
          <span className="listingHeader">{routes.projectSales.title}</span>
        </div>
        {isMobile && !isTablet ? (
          <div className="d-flex flex-wrap items-center justify-between w-full">
            <div>{toggleInner}</div>
            <div className="flex flex-wrap items-center gap-1">
              <IconButton
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                size="small"
                className={'mobileIconButton secondary'}
              >
                <TbArrowsSort className="rotate-90" size={16} />
              </IconButton>

              <MobileSortDialog
                isOpen={open}
                handleClose={handleClickClose}
                contentPart={toggleInner}
                secHeading={['Sort ProjectSales']}
                columns={columns}
                dispatch={dispatch}
              />

              <IconButton
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                size="small"
                className={'mobileIconButton secondary'}
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
                title={routes?.projectSales?.title}
                filters={filters}
              />
            </div>
          </div>
        ) : (
          <ToggleButtonGroup size="small" className="ml-8" value={selectedType} exclusive onChange={handleFilter}>
            <ToggleButton value={1}>My Projects</ToggleButton>
            <ToggleButton value={2}>All Projects</ToggleButton>
          </ToggleButtonGroup>
        )}
        {children}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} value={searchVal} className={styles.search_box_input} size="small" />
        <div className="flex gap-[8px] flex-wrap items-center">
          {permissions?.isCreate && permissions?.isUpdate && (
            <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={'no-shadow'} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}
          {(permissions?.isDelete || permissions?.isUpdate) && (
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
                {permissions?.isDelete && (
                  <MenuItem
                    disabled={canDelete}
                    onClick={() => {
                      showConfirmBox(null);
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
                {permissions?.isUpdate && (
                  <MenuItem
                    disabled={selectedRecords.length === 0}
                    onClick={() => {
                      if (selectedRecords.some((d) => d.isUpdate === false)) {
                        closeActions();
                        setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
                      } else {
                        closeActions();
                        if (selectedRecords.length) {
                          let entities = [];
                          selectedRecords.map((current) => {
                            if (current?.entity) {
                              if (current?.entityId) {
                                entities.push(current?.entityId);
                              }
                              if (current?.restentity) {
                                let restEntities = current?.restentity.map((o) => o.optionValue);
                                entities = [...entities, ...restEntities];
                              }
                            }
                          });
                          setEntities([...entities]);
                        }
                        setShowEntityDialog(true);
                      }
                    }}
                  >
                    Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectStrategyHeader;
