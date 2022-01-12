import { useState } from "react";
import SearchBox from "../../components/Helpers/SearchBox";
import {
  AddOutlined,
} from "@material-ui/icons";
import {FaUserTie, IoFilterCircle, MdAccountBalanceWallet, MdAdd, MdFilterList, MdSort, FaCalendarDay, RiTicketFill, RiArrowUpDownFill, RiArrowUpDownLine, BsArrowUpShort, BsArrowUp, BsArrowDown} from "react-icons/all";
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
import MobileSortDialog from "../../components/MobileSortDialog"
import MobileFilterDialog from "../../components/MobileFilterDialog"


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
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false)


  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);

  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };



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
    showCloneQuoteDialog,
    columns,
    dispatch

  } = props;

  let toggleInner = options && (
    <ToggleButtonGroup
      size="small"
      className=" toggle-button-layout"
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
  );

  return (
    <Grid className={styles.filter_side_container} container>
       <Grid item xs={12} md={6} sm={6} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
      <div className="d-flex align-items-center">
        {icon} <span className="listingHeader">{heading}</span>
        </div>
        {isMobile ? <div className="d-flex ">
        <Button
        onClick={handleClickOpen}
        id="demo-customized-button"
        aria-controls="demo-customized-menu"
        aria-haspopup="true"
        // aria-expanded={open ? 'true' : undefined}
        color="secondary"
        variant="text"
        disableElevation
        startIcon={<MdSort />}
      >
        Sort 
        </Button>

        <MobileSortDialog
        isOpen={open}
        handleClose={handleClickClose}
        contentPart={toggleInner}
        secHeading={["Sort Quotes"]}
        columns={columns}
        dispatch={dispatch}
      
        />



        <Button
        id="demo-customized-button"
        aria-controls="demo-customized-menu"
        aria-haspopup="true"
        // aria-expanded={open ? 'true' : undefined}
        variant="text"
        color="secondary"
        disableElevation
        startIcon={<MdFilterList />}
        onClick={handleOpen}
      >
        Filter 
        </Button>


        <MobileFilterDialog
        isOpen={isOpenDialog}
        handleClose={handleClose}
        contentPart={toggleInner}
        secHeading={["Filter Quotes"]}
        columns={columns}
        dispatch={dispatch}
        />


   
   
        

      


        </div> : 
        options && (
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
      <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
            <Grid style={{display: "flex", flex:1}}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Quotes"
              width={isMobile && !isTablet ? "200px" : "242px"}
              style={isMobile && !isTablet ? {flex:1} : {}}
            />
            </Grid>



              <Grid style={{display: "flex" , gap:"5px"}}>
              {QuotePermissions.isCreate && (
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
                  disabled={canDelete}
                  variant={isMobile && !isTablet ? "text" : "contained"}
                  color="default"
                  size="small"
                  onClick={openActions}
                  fullWidth={true}
                  className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                  aria-controls="action-menu"
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
