import { useState, useContext, useEffect } from 'react';
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
import { sidebarResource, CHILD_RESOURCE, serializedAsset } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { rentalJobOfflineUpdate } from './rentalOfflineHelper';
import DateRangeIcon from '@material-ui/icons/DateRange';
import { useHistory } from 'react-router-dom';

function RentalManagementHeader({
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
  fetchRentalManagement,
  gridApi,
  filters
  // showCloneRentalManagementDialog
}) {
  const {
    state: { permissions }
  }: any = useData();
  const [anchorEl, setAnchorEl] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

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
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'serializedAsset', data);
      });
    axiosInstance()
      .get(`/field?resource=Product&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'Product', data);
      });
    if (gridApi) gridApi.deselectAll();
  };

  const handleRemoveoffline = async () => {
    await clearAll(objectStore.rentalManagement);
    await clearAll(objectStore.deliveryTicket);
    closeActions();
  };

  let toggleInner = options && (
    <ToggleButtonGroup size="small" className="toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className={'d-flex flex-wrap align-items-center gap-1'}>
        <div className="flex flex-wrap">
          {icon} <span className="listingHeader">{heading}</span>
        </div>
        {isMobile && !isTablet ? (
          <>
            <div className="">
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
                columns={columns}
                dispatch={dispatch}
                filters={filters}
                title={routes?.rentalManagement?.title}
              />
            </div>
          </>
        ) : (
          <HideWhenOffline>
            <div className={`flex flex-wrap items-center gap-2 `}>
              {options && (
                <ToggleButtonGroup size="small" value={options[selectedType - 1].key} exclusive onChange={handleFilter}>
                  {options.map((k, index) => {
                    return (
                      <ToggleButton value={k.key} key={index}>
                        {k.key}
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
              )}
              {permissions?.planning?.isRead && (
                <ToggleButtonGroup size="small">
                  <ToggleButton
                    onClick={() => {
                      history.push({
                        pathname: routes.planning.path,
                        state: 'Rental Job'
                      });
                    }}
                  >
                    <span>{`Planned Rental`}</span>
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
              {permissions?.planningView?.isRead && (
                <ToggleButtonGroup size="small">
                  <ToggleButton
                    onClick={() => {
                      history.push({
                        pathname: routes.planningView.path,
                        state: {
                          resource: sidebarResource?.rentalManagement
                        }
                      });
                    }}
                  >
                    <span>{`Calendar`}</span>
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            </div>
          </HideWhenOffline>
        )}
        {children}
      </div>

      <div className="flex flex-wrap gap-[8px]  justify-end">
        <HideWhenOffline>
          <SearchBox
            onChange={onSearch}
            className={isMobile ? styles.search_box_input : ''}
            value={searchVal}
            size="small"
            placeholder={`Search ${routes.rentalManagement.title}`}
          />
        </HideWhenOffline>
        <div className="flex gap-[8px] flex-wrap items-center">
          <HideWhenOffline>
            {RentalManagementPermissions?.isCreate && RentalManagementPermissions?.isUpdate && (
              <Button
                variant={'contained'}
                color="primary"
                size="small"
                // className={styles.add_submit_btn}
                onClick={onCreate}
                className={'no-shadow'}
                startIcon={<AddOutlined />}
              >
                Add
              </Button>
            )}
            {RentalManagementPermissions?.isDelete && (
              <>
                <Button
                  //disabled={canDelete}
                  variant={'outlined'}
                  color="default"
                  size="small"
                  className={`new-dropdown-v1`}
                  onClick={openActions}
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
                  {(selectedRecords?.length > 0 && selectedRecords?.filter((e) => e.canDelete === true)?.length) === selectedRecords?.length ? (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        showConfirmBox(null);
                      }}
                    >
                      Delete
                    </MenuItem>
                  ) : null}
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
                    <MenuItem disabled={!selectedRecords.length} onClick={() => handleAddOffline()}>
                      Add Offline
                    </MenuItem>
                  }
                  {<MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>}
                </Menu>
              </>
            )}
          </HideWhenOffline>
        </div>
      </div>
    </div>
  );
}
export default RentalManagementHeader;
