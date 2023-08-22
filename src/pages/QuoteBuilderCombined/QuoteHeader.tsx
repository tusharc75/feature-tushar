import { useState, useEffect } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined } from '@material-ui/icons';
import { MdAdd, MdFilterList, MdSort } from 'react-icons/all';
import { Box, Grid, MenuItem, Button, Menu } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import routes from 'src/components/Helpers/Routes';

function QuoteHeader({
  selectedRecords,
  onTypeChange,
  options,
  onSearch,
  searchVal,
  onCreate,
  QuotePermissions,
  showConfirmBox,
  canDelete,
  icon,
  heading,
  children,
  showTransferEntityDialog,
  showCloneQuoteDialog,
  columns,
  dispatch,
  filters,
  selectedType
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const {
    state: { permissions }
  }: any = useData();

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

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
    if (newFilter != null) {
      onTypeChange(options.find((d) => d.key === newFilter).value);
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
        <div className="d-flex align-items-center">
          {icon} <span className="listingHeader">{heading}</span>
        </div>
        {isMobile && !isTablet ? (
          <div className="d-flex ">
            <Button
              onClick={handleClickOpen}
              id="demo-customized-button"
              aria-controls="demo-customized-menu"
              aria-haspopup="true"
              variant="text"
              disableElevation
              startIcon={<MdSort />}
            >
              Sort
            </Button>
            <MobileSortDialog
              isOpen={open}
              handleClose={handleClickClose}
              contentPart={toggleInner}
              secHeading={['Sort Quotes']}
              columns={columns}
              dispatch={dispatch}
            />
            <Button
              id="demo-customized-button"
              aria-controls="demo-customized-menu"
              aria-haspopup="true"
              variant="text"
              disableElevation
              startIcon={<MdFilterList />}
              onClick={handleOpen}
            >
              Filter
            </Button>
            <MobileFilterDialog
              isOpen={isOpenDialog}
              handleClose={handleClose}
              contentPart={toggleInner}
              columns={columns}
              dispatch={dispatch}
              title={routes?.quoteBuilder?.title}
              filters={filters}
            />
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
          {QuotePermissions.isCreate && (
            <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={'no-shadow'} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}
          {(QuotePermissions.isCreate || QuotePermissions.isUpdate) && (
            <>
              <Button
                disabled={canDelete}
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                className={` new-dropdown-v1`}
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
                  disabled={!permissions?.quoteBuilder?.isDelete}
                >
                  Delete
                </MenuItem>
                {QuotePermissions.isUpdate && (
                  <MenuItem
                    disabled={selectedRecords.find((d) => d.canDelete === false)}
                    onClick={() => {
                      closeActions();
                      showTransferEntityDialog();
                    }}
                  >
                    Transfer Entity
                  </MenuItem>
                )}
                <MenuItem
                  disabled={selectedRecords.length !== 1}
                  onClick={() => {
                    closeActions();
                    showCloneQuoteDialog();
                  }}
                >
                  Clone
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default QuoteHeader;
