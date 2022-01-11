import * as React from 'react';
import './MobileFilterDialog.scss';
import {
  Box,
  Grid,
  Button,
  styled,
  alpha,
  Dialog,
  DialogActions,
  DialogContent,
  Menu,
  MenuProps,
  DialogContentText,
  DialogTitle,
  Divider,
  Slide,
  List,
  ListItemIcon,
  ListItemText,
  createStyles,
  withStyles,
  makeStyles,
  Theme,
  Transitions
} from '@material-ui/core';
import MuiListItem from '@material-ui/core/ListItem';
//   import styles from "../Leads/Header.module.scss";
import styles from '../pages/Leads/Header.module.scss';
import {
  FaUserTie,
  IoFilterCircle,
  MdAccountBalanceWallet,
  MdAdd,
  MdFilterList,
  MdSort,
  FaCalendarDay,
  RiTicketFill,
  RiArrowUpDownFill,
  RiArrowUpDownLine,
  BsArrowUpShort,
  BsArrowUp,
  BsArrowDown
} from 'react-icons/all';
import { TransitionProps } from '@material-ui/core/transitions';
import { CustomToastContext } from '../StateProvider/CustomToastContext/CustomToastContext'

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right'
    }}
    {...props}
  />
));

const ListItem = withStyles({
  root: {
    borderLeft: '3px solid white',
    '& .MuiListItemIcon-root': {
      minWidth: '36px !important',
      fontSize: '20px'
    },
    '&$selected': {
      borderLeft: '3px solid #43AEAA',
      color: '#43AEAA !important',
      backgroundColor: 'white !important',
      '& .MuiListItemIcon-root': {
        color: '#43AEAA'
      },
      '& .MuiListItemText-primary': {
        fontWeight: 600
      }
    }
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
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MobileSortDialog({ isOpen, handleClose, contentPart, secHeading, columns,dispatch }) {
  const [selectedIndex, setSelectedIndex] = React.useState(1);
  const toastConfig = React.useContext(CustomToastContext)
  const [clicked, setClicked] = React.useState(false);
  const [ sortMode, setSortMode] = React.useState('');

  const handleListIconClick = (field,index:number) => {
    if(selectedIndex !== index){
      setClicked(true);
      setSortMode('asc')
      dispatch({
        type: 'sort',
        sorting: [{colId:field,sort:'asc'}]
      });

    } 

      if(selectedIndex === index && sortMode === 'asc'){
        
          setClicked(true);
          setSortMode('desc')
          dispatch({
            type: 'sort',
            sorting: [{colId:field,sort:'desc'}]
          });
        }
      


      if(selectedIndex === index && sortMode=== 'desc') {
        setClicked(true);
        setSortMode('default')
        dispatch({
          type: 'sort',
          sorting: []
        });
        
      }

      if(selectedIndex === index && sortMode=== 'default') {
        setClicked(true);
        setSortMode('asc')
        dispatch({
          type: 'sort',
          sorting: [{colId:field,sort:'asc'}]
        });
        
      }

      if(selectedIndex === index && sortMode===''){
        setClicked(true);
        setSortMode('asc')
        dispatch({
          type: 'sort',
          sorting: [{colId:field,sort:'asc'}]
        });
  
      } 
 
    toastConfig.setToastConfig({
      open: true,
      type: "success",
      message: 'Sorted Successfully',
    });

  };

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  return (
    <div>
      
      <Dialog
        open={isOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        className="mobile-filter-root"
      >
        <div className={styles.mobile_filter_content}>
          <DialogTitle className={styles.sort_title}>{'Sort By'}</DialogTitle>
          <Divider />
          <DialogContent className={styles.inner_content_sort}>
            <List component="nav" aria-label="main mailbox folders">
              {columns &&
                columns.map((column, index) => (
                  <ListItem button selected={selectedIndex === index} onClick={(event) => handleListItemClick(event, index)}>
                    <ListItemIcon>
                      < MdSort />
                    </ListItemIcon>
                    <ListItemText key={index} onClick={() => handleListIconClick(column.field,index)} primary={column.headerName} />
                    <ListItemIcon key={index} onClick={() => handleListIconClick(column.field,index)}>
                      {selectedIndex === index && clicked && sortMode=== 'asc' && <BsArrowUp />  }
                      {selectedIndex === index && clicked && sortMode === 'desc'  && <BsArrowDown />  }
                      {selectedIndex === index && clicked && sortMode === 'default'  && <RiArrowUpDownLine />  }
                      {selectedIndex === index && clicked && sortMode=== '' && <BsArrowUp />  }
                      

                    </ListItemIcon>
                  </ListItem>
                ))}

              {/* <ListItem
          button
          selected={selectedIndex === 0 }
          
          onClick={(event) => handleListItemClick(event, 0)}
        >
          <ListItemIcon>
              <FaUserTie/ >
          </ListItemIcon>
          <ListItemText primary="Owner/collaborater" />
        </ListItem>
        <ListItem
          button
          selected={selectedIndex === 1}
          onClick={(event) => handleListItemClick(event, 1)}
          
        >
          <ListItemIcon>
             <MdAccountBalanceWallet size={18}/>
          </ListItemIcon>
          <ListItemText primary="Account" />

          <ListItemIcon onClick={() => handleListIconClick(0)}>
            {selectedIndex === 1 ? clicked ? <BsArrowUp/> : <RiArrowUpDownLine/> : null}
          </ListItemIcon>
        </ListItem>


        <ListItem
          button
          selected={selectedIndex === 2}
          onClick={(event) => handleListItemClick(event, 2)}
          
        >
          <ListItemIcon>
             <FaCalendarDay />
          </ListItemIcon>
          <ListItemText primary="Date" />
        </ListItem>

        <ListItem
          button
          selected={selectedIndex === 3}
          onClick={(event) => handleListItemClick(event, 3)}
          
        >
          <ListItemIcon>
             <RiTicketFill />
          </ListItemIcon>
          <ListItemText primary="Status" />
        </ListItem> */}
            </List>
          </DialogContent>
        </div>
      </Dialog>
    </div>
  );
}
