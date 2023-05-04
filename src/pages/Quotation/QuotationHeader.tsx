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

function QuotationHeader(props) {
  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    QuotationPermissions,
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

  const [filter, setFilter] = useState(options[0].key);

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
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
              // aria-expanded={open ? 'true' : undefined}
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
              secHeading={['Sort Quotation']}
              columns={columns}
              dispatch={dispatch}
            />

            <Button
              id="demo-customized-button"
              aria-controls="demo-customized-menu"
              aria-haspopup="true"
              // aria-expanded={open ? 'true' : undefined}
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
              title={routes?.quotation?.title}
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
      <Grid item xs={12} sm={6} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
          <Grid style={{ display: 'flex', flex: 1 }}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              width="200px"
              placeholder="Search Quotation"
              style={isMobile ? { flex: 1 } : {}}
            />
          </Grid>

          <Grid style={{ display: 'flex', gap: '5px' }}>
            {QuotationPermissions?.isCreate && (
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
            )}
            {(QuotationPermissions?.isDelete || QuotationPermissions?.isUpdate) && (
              <>
                <Button
                  disabled={canDelete}
                  variant={isMobile ? 'text' : 'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={isMobile ? 'mobile_button' : styles.action_submit_btn}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                >
                  {isMobile ? '' : 'Actions'}
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
                  {/* {QuotationPermissions.isUpdate && (
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
export default QuotationHeader;
