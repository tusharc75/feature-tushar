import { useState } from "react";
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

function RentalManagementHeader(props) {
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const [filter, setFilter] = useState("All Rental Managements");

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    RentalManagementPermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog,
    // showCloneRentalManagementDialog

  } = props;
  return (
    <Grid className={styles.filter_side_container} container>
      <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
        {icon} <span className="listingHeader">{heading}</span>
        <HideWhenOffline>
          {options && (
            <ToggleButtonGroup
              size="small"
              className="ml-2"
              value={filter}
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
        <Box className={styles.filter_side_header} component="div">
          <HideWhenOffline>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Rental Managements"
              width="300px"
            />
          </HideWhenOffline>

          {RentalManagementPermissions.isCreate && RentalManagementPermissions.isUpdate && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              className={styles.add_submit_btn}
              onClick={onCreate}
              startIcon={<AddOutlined />}
            >
              Add
            </Button>
          )}

          <HideWhenOffline>
            {
              RentalManagementPermissions.isDelete && (
                <>
                  <Button
                    disabled={canDelete}
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActions}
                    className={styles.action_submit_btn}
                    aria-controls="action-menu"
                  >
                    Actions <ExpandMore />
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
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        showConfirmBox(null);
                      }}
                    >
                      Delete
                    </MenuItem>
                    {
                      RentalManagementPermissions.isUpdate && <MenuItem
                        disabled={selectedRecords.find((d) => d.canDelete === false)}
                        onClick={() => {
                          closeActions();
                          showTransferEntityDialog();
                        }}
                      >Transfer Entity</MenuItem>
                    }
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
              )
            }
          </HideWhenOffline>
        </Box>
      </Grid>
    </Grid>
  );
}
export default RentalManagementHeader;
