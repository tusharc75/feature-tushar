import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import routes from 'src/components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import styles from '../Leads/Header.module.scss';

function DemandOrderHeader(props) {
  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    SalesOrderPermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    columns,
    dispatch,
    showTransferEntityDialog,
    selectedType,
    filters,
    resource
    // showCloneRentalManagementDialog
  } = props;

  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);

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

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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
        <div className="d-flex align-items-center"></div>
        {isMobile && (
          <div className="d-flex flex-wrap items-center justify-between w-full gap-2">
            <div>{toggleInner}</div>
            <div className="flex flex-wrap items-center gap-1 ml-auto">
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
                secHeading={['Sort Service Order']}
                columns={columns}
                dispatch={dispatch}
              />
              <IconButton
                onClick={handleOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                className={'mobileIconButton secondary'}
                size="small"
              >
                <MdOutlineFilterAlt size={16} />
              </IconButton>
              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleClose}
                contentPart={null}
                columns={columns}
                dispatch={dispatch}
                title={routes?.fieldServiceOrder?.title}
                filters={filters}
                resource={resource}
              />
            </div>
          </div>
        )}
        {options && (
          <ToggleButtonGroup
            size="small"
            className="ml-2 align-items-center gap-1 layout-for-mobile "
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
          {
            <Button variant={'contained'} color="primary" size="small" className={`no-shadow`} onClick={onCreate} startIcon={<AddOutlined />}>
              Add
            </Button>
          }
          {SalesOrderPermissions?.isDelete && (
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
                {/* {SalesOrderPermissions.isUpdate && (
                  <MenuItem
                    disabled={selectedRecords.find((d) => d.canDelete === false)}
                    onClick={() => {
                      closeActions();
                      showTransferEntityDialog();
                    }}
                  >
                    Transfer Entity
                  </MenuItem>
                )} */}
                {/* <MenuItem
                  disabled={selectedRecords.length !== 1}
                  onClick={() => {
                    closeActions();
                    showCloneRentalManagementDialog()
                  }}
                >
                  Clone
                </MenuItem> */}
              </Menu>
            </>
          )}
        </div>
      </div>
      <DisplayFiltersForMobile resource={resource} />
    </div>
  );
}
export default DemandOrderHeader;
