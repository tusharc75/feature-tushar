import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";

import styles from "../Leads/Header.module.scss";
import SearchBox from "../../components/Helpers/SearchBox";
import { BiNetworkChart } from "react-icons/bi";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";

const ProjectStrategyHeader = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    permissions,
    showConfirmBox,
    canDelete,
    handleFilterChange,
    selectedType,
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      handleFilterChange(newFilter);
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
        <BiNetworkChart className="headerLogo" />
        <span className="listingHeader">Project Sales</span>
        <ToggleButtonGroup
          size="small"
          className="ml-8"
          value={selectedType}
          exclusive
          onChange={handleFilter}
        >
          <ToggleButton value={1}>All Projects</ToggleButton>
          <ToggleButton value={2}>My Projects</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={6} className={styles.filter_side}>
        <Box component="div" className={styles.filter_side_header}>
          <SearchBox
            onSearch={onSearch}
            value={searchVal}
            searchbox={styles.search_box_input}
            size="small"
            placeholder="Search Project Sales"
            width="242px"
          />

          {permissions.isCreate && permissions.isUpdate && (
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
          {permissions.isDelete && (
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
                  disabled={canDelete}
                  onClick={() => {
                    showConfirmBox(null);
                    closeActions();
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

export default ProjectStrategyHeader;
