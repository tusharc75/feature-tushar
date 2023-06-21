import React, { useState, useRef, useEffect } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import { AddOutlined } from '@material-ui/icons';
import { Box, Grid, MenuItem, Button, Menu } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdFilterList, MdSort } from 'react-icons/all';
import routes from 'src/components/Helpers/Routes';

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
    filters
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

  const [filter, setFilter] = useState('All Opportunities');

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
      handleClose();
    }
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
    <Grid className={styles.filter_side_container} container>
      <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
        {isMobile && !isTablet ? (
          <div className="d-flex ">
            <Button
              onClick={handleClickOpen}
              id="demo-customized-button"
              aria-controls="demo-customized-menu"
              aria-haspopup="true"
              color="secondary"
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
              secHeading={['Sort Opportunities']}
              columns={columns}
              dispatch={dispatch}
            />

            <Button
              id="demo-customized-button"
              aria-controls="demo-customized-menu"
              aria-haspopup="true"
              variant="text"
              color="secondary"
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
              title={routes?.opportunity?.title}
              filters={filters}
            />
          </div>
        ) : (
          options && (
            <ToggleButtonGroup size="small" className="ml-2" value={filter} exclusive onChange={handleFilter}>
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
      </Grid>
      <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
          <Grid style={{ display: 'flex', flex: 1 }}>
            <SearchBox
              onChange={onSearch}
              className={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Opportunity"
              width={isMobile && !isTablet ? '200px' : '242px'}
              style={isMobile && !isTablet ? { flex: 1 } : {}}
            />
          </Grid>
          <Grid style={{ display: 'flex', gap: '5px' }}>
            {opportunityPermissions.isCreate && opportunityPermissions.isUpdate && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                color="primary"
                size="small"
                className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                onClick={onCreate}
                startIcon={isMobile && !isTablet ? null : <AddOutlined />}
              >
                {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
              </Button>
            )}
            {(opportunityPermissions.isDelete || opportunityPermissions.isUpdate) && (
              <>
                <Button
                  disabled={canDelete}
                  variant={isMobile && !isTablet ? 'text' : 'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                >
                  {isMobile && !isTablet ? '' : 'Actions'}
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
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
export default OpportunitiesHeader;
