import { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const useStyles = makeStyles((theme) => ({
  filter_side: {
    display: "flex",
    justifyContent: "flex-end",
  },
}));

const Header = (props) => {
  const { selectedType,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    rolePermissions,
    showConfirmBox,
    canDelete,
  } = props;
  const classes = useStyles();
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
    <Grid container>
      <Grid item xs={6}>
        <h2>Roles</h2>
        {
          options && <ToggleButtonGroup size="small" className="ml-8"
            value={filter}
            exclusive
            onChange={handleFilter}>
            {options.map((k, index) => {
              return (
                <ToggleButton value={k.key} key={index}>{k.key}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        }
      </Grid>
      <Grid item xs={6} className={classes.filter_side}>
        <Box component="div">
          <Box component="span" marginX={1} />

          {rolePermissions.isCreate && (
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
            placeholder="Search Role"
            width="242px"
          />

          <Box component="span" marginX={1} />
          {rolePermissions.isDelete && (
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
