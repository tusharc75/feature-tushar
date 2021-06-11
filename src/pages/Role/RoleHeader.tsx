import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";

import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { BsPersonBoundingBox } from 'react-icons/bs';

import styles from "../Leads/Header.module.scss";
import { useData } from "../../StateProvider/Provider";
import { localStorageKeys } from "../../constants/helpers";

const RoleHeader = (props) => {
  const {
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    rolePermissions,
    showConfirmBox,
    canDelete,
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState(localStorage.getItem(localStorageKeys.currentSelectedRoleType) ?
    localStorage.getItem(localStorageKeys.currentSelectedRoleType) : "Global");

  const {
    state: { selectedEntity },
  }: any = useData();

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
      localStorage.setItem("currentSelectedRoleType", newFilter)
    }
  };
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={6} className="d-flex align-items-center gap-1">
        <BsPersonBoundingBox /> <span className="listingHeader">Roles</span>
        {options && (
          <ToggleButtonGroup
            size="small"
            value={filter}
            exclusive
            onChange={handleFilter}
          >
            {options.map((k, index) => {
              return (
                <ToggleButton value={k.key} key={index}>
                  {k.key === "Global" ? "Comapny wide role" : "Region wide functional role"}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        )}
      </Grid>
      <Grid item xs={6} className={styles.filter_side}>
        <Box component="div" className={styles.filter_side_header}>
          <SearchBox
            searchbox={styles.search_box_input}
            onSearch={onSearch}
            value={searchVal}
            size="small"
            placeholder="Search Role"
            width="242px"
          />
          {rolePermissions.isCreate && (filter === "Global" || (filter === "Regional" && selectedEntity)) && (
            <Button
              className={styles.add_submit_btn}
              variant="contained"
              color="primary"
              size="small"
              onClick={onCreate}
              startIcon={<AddOutlined />}
            >
              Add
            </Button>
          )}

          {rolePermissions.isDelete && (
            <>
              <Button
                className={styles.action_submit_btn}
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
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
                  disabled={Boolean(!canDelete)}
                  onClick={() => {
                    showConfirmBox(null);
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default RoleHeader;
