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
  MenuProps,
  styled, 
  alpha
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import styles from "../Leads/Header.module.scss";
import { isMobile } from "react-device-detect";
import {IoFilterCircle, MdAdd, MdFilterList, MdSort} from "react-icons/all";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))

function OpportunitiesHeader(props) {
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const [filter, setFilter] = useState("All Opportunities");

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
    opportunityPermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog
  } = props;
  return (
    <Grid className={styles.filter_side_container} container>
      <Grid item xs={12} md={6} sm={6} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
        <div className="d-flex align-items-center">
        {icon} <span className="listingHeader">{heading}</span>
        </div>
        {isMobile ? <div className="d-flex ">
        <Button
        id="demo-customized-button"
        aria-controls="demo-customized-menu"
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        color="secondary"
        variant="text"
        disableElevation
        startIcon={<MdSort />}
      >
        Sort 
        </Button>

        <Button
        id="demo-customized-button"
        aria-controls="demo-customized-menu"
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="text"
        color="secondary"
        disableElevation
        startIcon={<MdFilterList />}
      >
        Filter 
        </Button>
        </div> : options && (
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
        
        
        {children}
      </Grid>
      <Grid item xs={isMobile ? 12 : 6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
            <Grid style={{display: "flex", flex:1}}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Opportunity"
              width={isMobile ? "200px" : "242px"}
              style={isMobile ? {flex:1} : {}}
            />
            </Grid>
            <Grid style={{display: "flex" , gap:"5px"}}>
              {opportunityPermissions.isCreate && opportunityPermissions.isUpdate && (
                <Button
                    variant={isMobile ? "text" : "contained"}
                  color="primary"
                  size="small"
                    className={isMobile ? "mobile_button" : styles.add_submit_btn}
                  onClick={onCreate}
                  startIcon={isMobile ? null : <AddOutlined />}
                >
                  {isMobile ? <MdAdd size={23}/> : "Add"}
                </Button>
              )}
              {opportunityPermissions.isDelete && (
                <>
                  <Button
                    disabled={canDelete}
                    variant={isMobile ? "text" : "contained"}
                    color="default"
                    size="small"
                    onClick={openActions}
                    className={isMobile ? "mobile_button" : styles.action_submit_btn}
                    aria-controls="action-menu"
                  >
                    {isMobile ? "" :  "Actions" } <ExpandMore/>
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
                    <MenuItem
                      disabled={selectedRecords.find((d) => d.canDelete === false)}
                      onClick={() => {
                        closeActions();
                        showTransferEntityDialog();
                      }}
                    >
                      Transfer Entity
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
export default OpportunitiesHeader;
