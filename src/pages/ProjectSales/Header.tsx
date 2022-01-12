import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import Chip from "@material-ui/core/Chip"
import styles from "../Leads/Header.module.scss";
import SearchBox from "../../components/Helpers/SearchBox";
import { BiNetworkChart } from "react-icons/bi";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import {MdAdd} from "react-icons/all";

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
    selectedRecords = [],
    setShowDeleteWarningConfirmBox,
    setShowEntityDialog,
    setEntities
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
      <Grid item xs={12} sm={12} md={6} className="d-flex align-items-center gap-1">
        <Grid className="d-flex align-item-center">
        <BiNetworkChart className="headerLogo" />
        <span className="listingHeader">{routes.projectSales.title}</span>
        </Grid>
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
      <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
        <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header}>
            <Grid style={{display: "flex", flex:1}}>
            <SearchBox
              onSearch={onSearch}
              value={searchVal}
              searchbox={styles.search_box_input}
              size="small"
              placeholder="Search Project Sales"
              width={isMobile && !isTablet ? "200px" : "242px"}
              style={isMobile && !isTablet ? {flex:1} : {}}
            />
            </Grid>
          <Grid style={{display: "flex" , gap:"5px"}}>
              {permissions?.isCreate && permissions?.isUpdate && (
                <Button
                    variant={isMobile && !isTablet ? "text" : "contained"}
                  color="primary"
                  size="small"
                  onClick={onCreate}
                    className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                    startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                >
                  {isMobile && !isTablet ? <MdAdd size={23}/> : "Add"}
                </Button>
              )}

              <>
                <Button
                    variant={isMobile && !isTablet ? "text" : "contained"}
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                    className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                >
                  {isMobile && !isTablet ? "" :  "Actions" } <ExpandMore/>
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
                  {permissions?.isDelete && (
                    <MenuItem
                      disabled={canDelete}
                      onClick={() => {
                        showConfirmBox(null);
                        closeActions();
                      }}
                    >
                      Delete
                    </MenuItem>)}
                  {permissions?.isUpdate && (
                    <MenuItem
                      disabled={selectedRecords.length === 0}
                      onClick={() => {
                        if (selectedRecords.some((d) => d.isUpdate === false)) {
                          closeActions();
                          setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
                        } else {
                          closeActions();
                          if (selectedRecords.length) {
                            let entities = []
                            selectedRecords.map(current => {
                              if (current?.entity) {
                                if (current?.entityId) {
                                  entities.push(current?.entityId)
                                }
                                if (current?.restentity) {
                                  let restEntities = current?.restentity.map(o => o.optionValue)
                                  entities = [...entities, ...restEntities]
                                }
                              }
                            })
                            setEntities([...entities])
                          }
                          setShowEntityDialog(true)
                        }
                      }}
                    >
                      Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                    </MenuItem>
                  )}
                </Menu>
              </>
          </Grid>

        </Box>
      </Grid>
    </Grid>
  );
};

export default ProjectStrategyHeader;
