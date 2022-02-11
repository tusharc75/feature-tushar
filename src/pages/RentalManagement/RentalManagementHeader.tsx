import { useState, useContext,useEffect } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined } from '@material-ui/icons';
import { Box, Grid, MenuItem, Button, Menu } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import HideWhenOffline from '../../components/HideWhenOffline';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdFilterList, MdSort } from 'react-icons/md';
import { objectStore, insertUpdate, clearAll } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { sidebarResource, CHILD_RESOURCE } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { rentalJobOfflineUpdate } from './rentalOfflineHelper';

function RentalManagementHeader(props) {

  
  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    RentalManagementPermissions,
    showConfirmBox,
    icon,
    heading,
    children,
    columns,
    dispatch,
    showTransferEntityDialog,
    selectedType,
    fetchRentalManagement
    // showCloneRentalManagementDialog
  } = props;

 
 
  const {
    state: { selectedEntity }
  }: any = useData();
  const [anchorEl, setAnchorEl] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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

  const [filter, setFilter] = useState(`All ${routes.rentalManagement.title}`);

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
     
    }
  };

  const handleAddOffline = async () => {
    const data: any = [];
    selectedRecords.forEach((element) => {
      data.push(element._id);
    });
    await rentalJobOfflineUpdate(data);
    closeActions();
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'rentalManagementProduct', data);
      });
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'rentalManagementCost', data);
      });
    axiosInstance()
      .get(`/field?resource=${sidebarResource['deliveryTicket']}&showHiddenFields=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, objectStore.deliveryTicket, data);
      });
    axiosInstance()
      .get(`/field?resource=Serialized Asset&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'serializedAsset', data);
      });
  };

  


  const handleRemoveoffline = async () => {
    await clearAll(objectStore.rentalManagement);
    await clearAll(objectStore.deliveryTicket);
    closeActions();
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
    <Grid container className={styles.rental_header_layout}>
      <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet">
        <Grid>
          {icon} <span className="listingHeader">{heading}</span>
        </Grid>
        {isMobile ? (
          <>
            <Grid style={{ display: 'inline-flex' }}>
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
                className={'sort-filter-tablet'}
                style={isTablet ? { marginLeft: '50px' } : {}}
              >
                Sort
              </Button>

              <MobileSortDialog
                isOpen={open}
                handleClose={handleClickClose}
                contentPart={toggleInner}
                secHeading={['Sort Rental Job']}
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
                className={'sort-filter-tablet'}
                startIcon={<MdFilterList />}
                onClick={handleOpen}
              >
                Filter
              </Button>

              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleClose}
                contentPart={toggleInner}
                secHeading={['Filter Rental Job']}
                columns={columns}
                dispatch={dispatch}
              />
            </Grid>
          </>
        ):
        <HideWhenOffline>
          <div className={`align-items-center gap-1 layout-for-mobile `}>
            {options && (
              <ToggleButtonGroup size="small" className="ml-2" value={options[selectedType - 1].key} exclusive onChange={handleFilter}>
                {options.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            )}
          </div>
        </HideWhenOffline>}
        {children}
      </Grid>

      <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
          <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={isMobile ? styles.content_box : ''}>
            <HideWhenOffline>
              <SearchBox
                onSearch={onSearch}
                searchbox={isMobile ? styles.search_box_input : ''}
                value={searchVal}
                size="small"
                placeholder={`Search ${routes.rentalManagement.title}`}
                style={isMobile ? { flex: 1 } : {}}
              />
            </HideWhenOffline>
            <Grid style={{ display: 'flex', gap: '5px' }}>
              <HideWhenOffline>
                {RentalManagementPermissions.isCreate && RentalManagementPermissions.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    // className={styles.add_submit_btn}
                    onClick={onCreate}
                    className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                    startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                  >
                    {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                  </Button>
                )}
                {RentalManagementPermissions.isDelete && (
                  <>
                    <Button
                      //disabled={canDelete}
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                      onClick={openActions}
                      // className={styles.action_submit_btn}
                      aria-controls="action-menu"
                    >
                      {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
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
                      {/* <MenuItem
                        onClick={() => {
                          closeActions();
                          showConfirmBox(null);
                        }}
                      >
                        Delete
                      </MenuItem> */}
                        {/* {
                        RentalManagementPermissions.isUpdate && <MenuItem
                          disabled={!selectedRecords.length || selectedRecords.find((d) => d.canDelete === false)}
                          onClick={() => {
                            closeActions();
                            showTransferEntityDialog();
                          }}
                        >Transfer Entity</MenuItem>
                      } */}
                      {
                        <MenuItem
                          disabled={!selectedRecords.length || selectedRecords.find((d) => d.canDelete === false)}
                          onClick={() => handleAddOffline()}
                        >
                          Add Offline
                        </MenuItem>
                      }
                      {<MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>}
                    </Menu>
                  </>
                )}
              </HideWhenOffline>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
export default RentalManagementHeader;
