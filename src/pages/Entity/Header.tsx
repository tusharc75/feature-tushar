import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";

import styles from "../Leads/Header.module.scss";
import SearchBox from "../../components/Helpers/SearchBox";

const Header = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    entityPermissions,
    showConfirmBox,
    canDelete,
    openRolesDialog,
    rolesActionDiabled,
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={6} className="d-flex align-items-center gap-1">
        <span className="listingHeader">Entities</span>
      </Grid>
      <Grid item xs={6} className={styles.filter_side}>
        <Box component="div" className={styles.filter_side_header}>
          <SearchBox
            onSearch={onSearch}
            value={searchVal}
            searchbox={styles.search_box_input}
            size="small"
            placeholder="Search Entities"
            width="242px"
          />
          {entityPermissions.isCreate && (
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

          {entityPermissions.isDelete && (
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
                  disabled={Boolean(canDelete)}
                  onClick={() => {
                    showConfirmBox(null);
                    closeActions();
                  }}
                >
                  Delete
                </MenuItem>
                <MenuItem
                  disabled={rolesActionDiabled}
                  onClick={() => {
                    openRolesDialog();
                    closeActions();
                  }}
                >
                  Assign Roles
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
