import { useState, useContext } from "react";
import SearchBox from "../../components/Helpers/SearchBox";
import {
  AddOutlined,
} from "@material-ui/icons";
import {
  Box,
  Grid,
  MenuItem,
  Button,
  Menu,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import styles from "../Leads/Header.module.scss";
import HideWhenOffline from "../../components/HideWhenOffline";
import routes from "../../components/Helpers/Routes";
import { isMobile } from 'react-device-detect';
import { MdAdd } from "react-icons/all";
import { objectStore, insertUpdate, clearAll } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { sidebarResource, CHILD_RESOURCE } from '../../constants/helpers';
import { useData } from "../../StateProvider/Provider";
import { rentalJobOfflineUpdate } from "./rentalOfflineHelper";

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
    showTransferEntityDialog,
    selectedType
    // showCloneRentalManagementDialog
  } = props;

  const { state: { selectedEntity } }: any = useData();
  const [anchorEl, setAnchorEl] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const [filter, setFilter] = useState(`All ${routes.rentalManagement.title}`);

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  const handleAddOffline = async () => {
    const data: any = []
    selectedRecords.forEach(element => {
      data.push(element._id)
    });
    await rentalJobOfflineUpdate(data)
    closeActions()
    axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`).then(({ data: { data } }) => {
      insertUpdate(objectStore.resource, "rentalManagementProduct", data);
    })
    axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`).then(({ data: { data } }) => {
      insertUpdate(objectStore.resource, "rentalManagementCost", data);
    })
    axiosInstance().get(`/field?resource=${sidebarResource['deliveryTicket']}&showHiddenFields=true`).then(({ data: { data } }) => {
      insertUpdate(objectStore.resource, objectStore.deliveryTicket, data);
    })
    axiosInstance().get(`/field?resource=Product Inventory&view=true`).then(({ data: { data } }) => {
      insertUpdate(objectStore.resource, "productInventory", data);
    })
  }

  const handleRemoveoffline = async () => {
    await clearAll(objectStore.rentalManagement)
    await clearAll(objectStore.deliveryTicket)
    closeActions()
  }

  return (
    <Grid container className={styles.rental_header_layout}>
      <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
        {icon} <span className="listingHeader">{heading}</span>
        <HideWhenOffline>
          {options && (
            <ToggleButtonGroup
              size="small"
              className="ml-2"
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
        </HideWhenOffline>
        {children}
      </Grid>
      <Grid item xs={12} sm={6} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
          <Grid style={{ display: "flex", flex: 1 }}>
            <HideWhenOffline>
              <SearchBox
                onSearch={onSearch}
                searchbox={styles.search_box_input}
                value={searchVal}
                size="small"
                placeholder={`Search ${routes.rentalManagement.title}`}
                style={isMobile ? { flex: 1 } : {}}
              />
            </HideWhenOffline>
          </Grid>
          <Grid style={{ display: "flex", gap: "5px" }}>
            <HideWhenOffline>
              {RentalManagementPermissions.isCreate && RentalManagementPermissions.isUpdate && (
                <Button
                  variant={isMobile ? "text" : "contained"}
                  color="primary"
                  size="small"
                  // className={styles.add_submit_btn}
                  onClick={onCreate}
                  className={isMobile ? "mobile_button" : styles.add_submit_btn}
                  startIcon={isMobile ? null : <AddOutlined />}
                >
                  {isMobile ? <MdAdd size={23} /> : "Add"}
                </Button>
              )}
              {
                RentalManagementPermissions.isDelete && (
                  <>
                    <Button
                      //disabled={canDelete}
                      variant={isMobile ? "text" : "outlined"}
                      color="default"
                      size="small"
                      className={isMobile ? "mobile_button" : styles.action_submit_btn}
                      onClick={openActions}
                      // className={styles.action_submit_btn}
                      aria-controls="action-menu"
                    >
                      {isMobile ? "" : "Actions"} <ExpandMore />
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
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
                        >Add Offline</MenuItem>
                      }
                      {
                        <MenuItem
                          onClick={() => handleRemoveoffline()}
                        >Clear All Offline Data</MenuItem>
                      }
                    </Menu>
                  </>
                )
              }
            </HideWhenOffline>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
export default RentalManagementHeader;
