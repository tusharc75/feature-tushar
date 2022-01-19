import React ,{ useState, useRef, useEffect } from "react";
import SearchBox from "../../components/Helpers/SearchBox";
import MobileFilterDialog from "../../components/MobileFilterDialog";
import MobileSortDialog from "../../components/MobileSortDialog";
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
  alpha,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Divider,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  List,
  ListItemIcon,
  ListItemText,
  withStyles,
  makeStyles
} from "@material-ui/core";
import MuiListItem from "@material-ui/core/ListItem";
import { TransitionProps } from '@material-ui/core/transitions';
import { ExpandMore } from "@material-ui/icons";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import styles from "../Leads/Header.module.scss";
import { isMobile, isTablet } from "react-device-detect";
import {FaUserTie, IoFilterCircle, MdAccountBalanceWallet, MdAdd, MdFilterList, MdSort, FaCalendarDay, RiTicketFill, RiArrowUpDownFill, RiArrowUpDownLine, BsArrowUpShort, BsArrowUp, BsArrowDown} from "react-icons/all";

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
));


const ListItem = withStyles({
  root: {
    borderLeft:"3px solid white",
    "& .MuiListItemIcon-root": {
      minWidth:"36px !important",
      fontSize:"16px",
    },
    "&$selected": {
      borderLeft: "3px solid #43AEAA",
      color: "#43AEAA !important",
      backgroundColor:"white !important",
      "& .MuiListItemIcon-root": {
        color: "#43AEAA"
      },
      "& .MuiListItemText-primary":{
          fontWeight:600
      }
    },
    // "&$selected:hover": {
    //   backgroundColor: "purple",
    //   color: "white",
    //   "& .MuiListItemIcon-root": {
    //     color: "white"
    //   }
    // },
    // "&:hover": {
    //   backgroundColor: "blue",
    //   color: "white",
    //   "& .MuiListItemIcon-root": {
    //     color: "white"
    //   }
    // }
  },
  selected: {}
})(MuiListItem);


const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});


function OpportunitiesHeader(props) {
  const ref = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const [clicked, setClicked] = useState(false);

  const handleListIconClick = (id) => {
    setClicked(true)
  }

  const [isOpenDialog, setisOpenDialog] = useState(false)



  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);

  };



  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const [show, setShow] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false)


  // Sort 

  const [selectedIndex, setSelectedIndex] = React.useState(1);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  


  useEffect(() => {
    const checkIfClickedOutside = e => {
      // If the menu is open and the clicked target is not within the menu,
      // then close the menu
      if (isMenuOpen && ref.current && !ref.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", checkIfClickedOutside)

    return () => {
      // Cleanup the event listener
      document.removeEventListener("mousedown", checkIfClickedOutside)
    }
  }, [isMenuOpen])


  useEffect(() => {
    if(JSON.parse(sessionStorage.getItem('sortSuccess')) === 'sortSuccess'){
      handleClickClose();
      sessionStorage.removeItem('sortSuccess')
    }

    
  },[JSON.parse(sessionStorage.getItem('sortSuccess'))])


  useEffect(() => {
    if(JSON.parse(sessionStorage.getItem('filterSuccess')) === 'filterSuccess'){
      handleClose();
      sessionStorage.removeItem('filterSuccess')
    }

    
  },[JSON.parse(sessionStorage.getItem('filterSuccess'))])



  const [filter, setFilter] = useState("All Opportunities");

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
      sessionStorage.setItem('filterSuccess',JSON.stringify('filterSuccess'));
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
    showTransferEntityDialog,
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
    <Grid className={styles.filter_side_container} container >
      <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
        <div className="d-flex align-items-center">
        {icon} <span className="listingHeader">{heading}</span>
        </div>
        {isMobile && !isTablet ? 
        <div className="d-flex ">
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
        secHeading={["Sort Opportunities"]}
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
        secHeading={["Filter Opportunities"]}
        columns={columns}
        dispatch={dispatch}
        />


   
   
        

      


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
      <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
            <Grid style={{display: "flex", flex:1}}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Opportunity"
              width={isMobile && !isTablet ? "200px" : "242px"}
              style={isMobile && !isTablet ? {flex:1} : {}}
            />
            </Grid>
            <Grid style={{display: "flex" , gap:"5px"}}>
              {opportunityPermissions.isCreate && opportunityPermissions.isUpdate && (
                <Button
                    variant={isMobile && !isTablet ? "text" : "contained"}
                  color="primary"
                  size="small"
                    className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                  onClick={onCreate}
                  startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                >
                  {isMobile && !isTablet ? <MdAdd size={23}/> : "Add"}
                </Button>
              )}
              {opportunityPermissions.isDelete && (
                <>
                  <Button
                    disabled={canDelete}
                    variant={isMobile && !isTablet ? "text" : "contained"}
                    color="default"
                    size="small"
                    onClick={openActions}
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
