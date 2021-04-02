import { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";
import { FaUsers } from 'react-icons/fa';

const useStyles = makeStyles((theme) => ({
  filter_side: {
    display: "flex",
    justifyContent: "flex-end",
  },
}));

const Header = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    userPermissions,
    showConfirmBox,
    canDelete,
  } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Grid container>
      <Grid item xs={6} className="d-flex align-items-center gap-1">
          <FaUsers className="headerLogo" /> <span className="listingHeader">Users</span>
      </Grid>
      <Grid item xs={6} className={classes.filter_side}>
        <Box component="div">
          <Box component="span" marginX={1} />

          {userPermissions.isCreate && (
            <Button
              variant="contained"
              color="primary"
              onClick={onCreate}
              startIcon={<AddOutlined />}
            >
              Add
            </Button>
          )}
          <Box component="span" marginX={1} />
          <SearchBox
            onSearch={onSearch}
            value={searchVal}
            size="small"
            placeholder="Search Users"
            width="242px"
          />

          <Box component="span" marginX={1} />
          {userPermissions.isDelete && (
            <>
              <Button
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
