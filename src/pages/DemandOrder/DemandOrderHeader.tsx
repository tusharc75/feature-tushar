import { useState, useEffect } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined } from '@material-ui/icons';
import { Box, Grid, MenuItem, Button, Menu } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdSort, MdFilterList } from 'react-icons/all';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import routes from 'src/components/Helpers/Routes';

function SalesOrderHeader(props) {
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
    filters
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Grid className={styles.filter_side_container} container>
      <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
        <div className="d-flex align-items-center">
          {icon} <span className="listingHeader">{heading}</span>
        </div>
        {children}
      </Grid>
      <Grid item xs={12} sm={6} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
          <Grid style={{ display: 'flex', flex: 1 }}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              width="200px"
              placeholder="Search Sales Orders"
              style={isMobile ? { flex: 1 } : {}}
            />
          </Grid>

          <Grid style={{ display: 'flex', gap: '5px' }}>
            {
              <Button
                variant={isMobile ? 'text' : 'contained'}
                color="primary"
                size="small"
                className={isMobile ? 'mobile_button' : styles.add_submit_btn}
                onClick={onCreate}
                startIcon={isMobile ? null : <AddOutlined />}
              >
                {isMobile ? <MdAdd size={23} /> : 'Add'}
              </Button>
            }
            {SalesOrderPermissions?.isDelete && (
              <>
                <Button
                  disabled={canDelete}
                  variant={isMobile ? 'text' : 'contained'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={isMobile ? 'mobile_button' : styles.action_submit_btn}
                  aria-controls="action-menu"
                >
                  {isMobile ? '' : 'Actions'} <ExpandMore />
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
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
export default SalesOrderHeader;
