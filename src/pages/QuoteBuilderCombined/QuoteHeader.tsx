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
import { useData } from "../../StateProvider/Provider";
import { isMobile } from 'react-device-detect';
import {MdAdd} from "react-icons/all";

function QuoteHeader(props) {
  const [anchorEl, setAnchorEl] = useState(null);

  const {
    state: { permissions },
  }: any = useData();

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const [filter, setFilter] = useState("All Quotes");

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
    QuotePermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog,
    showCloneQuoteDialog

  } = props;
  return (
    <Grid className={styles.filter_side_container} container>
      <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
        {icon} <span className="listingHeader">{heading}</span>
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
        {children}
      </Grid>
      <Grid item xs={12} sm={6} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
            <Grid style={{display: "flex", flex:1}}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Quotes"
              width={isMobile ? "200px" : "242px"}
              style={isMobile ? {flex:1} : {}}
            />
            </Grid>



              <Grid style={{display: "flex" , gap:"5px"}}>
              {QuotePermissions.isCreate && QuotePermissions.isUpdate && (
                <Button
                    variant={isMobile ? "text" : "contained"}
                  color="primary"
                  size="small"
                  onClick={onCreate}
                    className={isMobile ? "mobile_button" : styles.add_submit_btn}
                    startIcon={isMobile ? null : <AddOutlined />}
                >
                  {isMobile ? <MdAdd size={23}/> : "Add"}
                </Button>
              )}
              <>
                <Button
                  disabled={canDelete}
                  variant={isMobile ? "text" : "contained"}
                  color="default"
                  size="small"
                  onClick={openActions}
                  fullWidth={true}
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
                    disabled={!permissions?.quoteBuilder?.isDelete}
                  >
                    Delete
                  </MenuItem>
                  {
                    QuotePermissions.isUpdate && <MenuItem
                      disabled={selectedRecords.find((d) => d.canDelete === false)}
                      onClick={() => {
                        closeActions();
                        showTransferEntityDialog();
                      }}
                    >Transfer Entity</MenuItem>
                  }
                  <MenuItem
                    disabled={selectedRecords.length !== 1}
                    onClick={() => {
                      closeActions();
                      showCloneQuoteDialog()
                    }}
                  >
                    Clone
                  </MenuItem>
                </Menu>
              </>
              </Grid>

        </Box>
      </Grid>
    </Grid>
  );
}
export default QuoteHeader;
