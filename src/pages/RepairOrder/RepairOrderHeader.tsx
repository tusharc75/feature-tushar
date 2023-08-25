import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { TbArrowsSort } from 'react-icons/tb';
import routes from 'src/components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import styles from '../Leads/Header.module.scss';

function RepairOrderHeader(props) {
  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    RepairOrderPermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog,
    selectedType,
    columns,
    dispatch,
    filters
    // showCloneRentalManagementDialog
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const [filter, setFilter] = useState(options[0].key);
  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  let toggleInner = options && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
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
        {isMobile && !isTablet && (
          <>
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
                  secHeading={['Sort Repair Order']}
                  columns={columns}
                  dispatch={dispatch}
                />

                <IconButton
                  onClick={handleOpen}
                  id="demo-customized-button"
                  aria-controls="demo-customized-menu"
                  aria-haspopup="true"
                  // aria-expanded={open ? 'true' : undefined}
                  size="small"
                  className={'mobileIconButton secondary'}
                >
                  <MdOutlineFilterAlt size={16} />
                </IconButton>
                <MobileFilterDialog
                  isOpen={isOpenDialog}
                  handleClose={handleClose}
                  contentPart={null}
                  columns={columns}
                  dispatch={dispatch}
                  title={routes?.repairOrder?.title}
                  filters={filters}
                />
              </div>
            </div>
          </>
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
        {children}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />
        <div className="flex gap-[8px] flex-wrap items-center">
          {RepairOrderPermissions?.isCreate && RepairOrderPermissions?.isUpdate && (
            <Button
              variant={'contained'}
              color="primary"
              size="small"
              // className={styles.add_submit_btn}
              className={'no-shadow'}
              startIcon={<AddOutlined />}
              onClick={onCreate}
            >
              Add
            </Button>
          )}
          {RepairOrderPermissions?.isDelete && (
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

export default RepairOrderHeader;
