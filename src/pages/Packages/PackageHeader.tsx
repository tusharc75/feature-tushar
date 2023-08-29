import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import routes from 'src/components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import HideWhenOffline from '../../components/HideWhenOffline';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import styles from '../Leads/Header.module.scss';

function PackageHeader(props) {
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const [filter, setFilter] = useState('All Packages');

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

  const {
    openAssingToProduct,
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    packagePermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog,
    columns,
    dispatch,
    // showClonePackageDialog
    filters
  } = props;

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
          <div className="d-flex flex-wrap items-center justify-between w-full">
            <div></div>
            <div className="flex flex-wrap items-center gap-1 ml-auto">
              <IconButton
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
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
                aria-expanded={open ? 'true' : undefined}
                className={'mobileIconButton secondary'}
                size="small"
                onClick={handleOpen}
              >
                <MdOutlineFilterAlt size={16} />
              </IconButton>
              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleClose}
                contentPart={toggleInner}
                columns={columns}
                dispatch={dispatch}
                title={routes?.packages?.title}
                filters={filters}
              />
            </div>
          </div>
        )}
        <HideWhenOffline>
          {options && (
            <ToggleButtonGroup size="small" className="ml-2" value={filter} exclusive onChange={handleFilter}>
              {options.map((k, index) => {
                return (
                  <ToggleButton value={k.key} key={index}>
                    {k.key}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          )}
        </HideWhenOffline>

        {children}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <div className="flex flex-wrap gap-[8px]  justify-end">
          <HideWhenOffline>
            <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />
          </HideWhenOffline>

          <div className="flex gap-[8px] flex-wrap items-center">
            {packagePermissions.isCreate && packagePermissions.isUpdate && (
              <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={`no-shadow`} startIcon={<AddOutlined />}>
                Add
              </Button>
            )}

            <HideWhenOffline>
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
                  {packagePermissions.isDelete && (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        showConfirmBox(null);
                      }}
                    >
                      Delete
                    </MenuItem>
                  )}
                  {/* {packagePermissions.isUpdate && <MenuItem
                                        onClick={() => {
                                            openAssingToProduct()
                                            closeActions();
                                        }}
                                    >
                                        Assign Products
                                    </MenuItem>} */}
                </Menu>
              </>
            </HideWhenOffline>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PackageHeader;
