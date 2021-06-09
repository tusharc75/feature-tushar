import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import styles from "../Leads/Header.module.scss";
import SearchBox from "../../components/Helpers/SearchBox";
import { BiNetworkChart } from "react-icons/bi"
  ;
const EntityHeader = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    entityPermissions,
    openUserDialog,
    userActionDiabled,
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
        <BiNetworkChart className="headerLogo" />
        <span className="listingHeader">Entity/Entities</span>
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
              size="small"
              onClick={onCreate}
              startIcon={<AddOutlined />}
            >
              Add
            </Button>
          )}

          {entityPermissions.isUpdate ? (
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
                {/* {entityPermissions.isDelete && (
                  <MenuItem
                    disabled={Boolean(canDelete)}
                    onClick={() => {
                      showConfirmBox(null);
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )} */}
                {entityPermissions.isUpdate && (
                  <MenuItem
                    disabled={userActionDiabled}
                    onClick={() => {
                      openUserDialog();
                      closeActions();
                    }}
                  >
                    Assign User
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : null}
        </Box>
      </Grid>
    </Grid>
  );
};

export default EntityHeader;
