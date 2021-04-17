import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";

import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

import styles from "../Leads/Header.module.scss";

const Header = (props) => {
  const {
    selectedType,
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
  const [filter, setFilter] = useState("Global");

  const handleFilter = (event, newFilter) => {
    setFilter(newFilter);
    onTypeChange(options.find((d) => d.key === newFilter).value);
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
        <h2>Roles</h2>
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
          {rolePermissions.isCreate && (
            <Button
              className={styles.add_submit_btn}
              variant="contained"
              color="primary"
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

export default Header;
