import { useState } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined } from '@material-ui/icons';
import { Box, Grid, MenuItem, Button, Menu, IconButton } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import { isMobile, isTablet } from 'react-device-detect';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { MdAdd, MdSort, MdFilterList } from 'react-icons/md';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import AppsIcon from '@material-ui/icons/Apps';
import ViewListIcon from '@material-ui/icons/ViewList';

function JobHeader(props) {
  const {
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    permissions,
    showConfirmBox,
    canDelete,
    children,
    selectedType,
    columns,
    dispatch,
    filters,
    viewType,
    setViewType
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState(options[0].key);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const history = useHistory();

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  let toggleInner = options && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
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
      <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet">
        {isMobile && (
          <>
            <Grid style={{ display: 'inline-flex' }}>
              <Button
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                color="secondary"
                variant="text"
                disableElevation
                startIcon={<MdSort />}
                className={'sort-filter-tablet'}
                style={isTablet ? { marginLeft: '50px' } : {}}
              >
                Sort
              </Button>

              <MobileSortDialog
                isOpen={open}
                handleClose={handleClickClose}
                contentPart={toggleInner}
                secHeading={['Sort Job']}
                columns={columns}
                dispatch={dispatch}
              />

              <Button
                onClick={handleOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                variant="text"
                color="secondary"
                disableElevation
                className={'sort-filter-tablet'}
                startIcon={<MdFilterList />}
              >
                Filter
              </Button>
              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleClose}
                contentPart={toggleInner}
                columns={columns}
                dispatch={dispatch}
                title={routes?.job?.title}
                filters={filters}
              />
            </Grid>
          </>
        )}

        {options && (
          <ToggleButtonGroup
            size="small"
            className="ml-2 align-items-center gap-1 layout-for-mobile "
            value={options[selectedType - 1].key}
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
        {permissions?.fleetDispatch?.isRead && (
          <Box ml={1}>
            <ToggleButtonGroup size="small">
              <ToggleButton
                onClick={() => {
                  history.push(`${routes.fleetDispatch.path}`);
                }}
              >
                <span>{routes.fleetDispatch.title}</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        {permissions?.fleetReceiver?.isRead && (
          <Box ml={1}>
            <ToggleButtonGroup size="small">
              <ToggleButton
                onClick={() => {
                  history.push(`${routes.fleetReceiver.path}`);
                }}
              >
                <span>{routes.fleetReceiver.title}</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        <Box ml={1}>
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setViewType(1);
            }}
          >
            <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setViewType(2);
            }}
          >
            <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
          </IconButton>
        </Box>
        {children}
      </Grid>
      <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
          <Grid style={{ display: 'flex', flex: 1 }}>
            <SearchBox
              onSearch={onSearch}
              searchbox={styles.search_box_input}
              value={searchVal}
              size="small"
              placeholder="Search Job"
              style={isMobile ? { flex: 1 } : {}}
            />
          </Grid>

          <Grid style={{ display: 'flex', gap: '5px' }}>
            {permissions?.job?.isCreate && permissions?.job?.isUpdate && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                color="primary"
                size="small"
                onClick={onCreate}
                className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                startIcon={isMobile && !isTablet ? null : <AddOutlined />}
              >
                {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
              </Button>
            )}
            {permissions?.job?.isDelete && (
              <>
                <Button
                  disabled={canDelete}
                  variant={isMobile ? 'text' : 'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  className={isMobile ? 'mobile_button' : styles.action_submit_btn}
                  endIcon={<ExpandMore />}
                >
                  {isMobile ? '' : 'Actions'}
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
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
                </Menu>
              </>
            )}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}

export default JobHeader;
