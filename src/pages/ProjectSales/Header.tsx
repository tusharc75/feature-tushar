import { useState, useEffect } from 'react';
import { Box, Grid, MenuItem, Button, Menu } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import styles from '../Leads/Header.module.scss';
import SearchBox from '../../components/Helpers/SearchBox';
import { BiNetworkChart } from 'react-icons/bi';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import routes from '../../components/Helpers/Routes';
import { isMobile } from 'react-device-detect';
import { MdAdd, MdFilterList, MdSort } from 'react-icons/all';

import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';

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
    setEntities,
    columns,
    dispatch,
    children,
    filters
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);

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

  let toggleInner = (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={selectedType} exclusive onChange={handleFilter}>
      <ToggleButton value={1}>All Projects</ToggleButton>
      <ToggleButton value={2}>My Projects</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={12} md={6} sm={6} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
        <div className="d-flex align-items-center">
          <BiNetworkChart className="headerLogo" />
          <span className="listingHeader">{routes.projectSales.title}</span>
        </div>
        {isMobile ? (
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
              secHeading={['Sort ProjectSales']}
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
              columns={columns}
              dispatch={dispatch}
              title={routes?.projectSales?.title}
              filters={filters}
            />
          </div>
        ) : (
          <ToggleButtonGroup size="small" className="ml-8" value={selectedType} exclusive onChange={handleFilter}>
            <ToggleButton value={1}>All Projects</ToggleButton>
            <ToggleButton value={2}>My Projects</ToggleButton>
          </ToggleButtonGroup>
        )}
        {children}
      </Grid>
      <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
        <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header}>
          <Grid style={{ display: 'flex', flex: 1 }}>
            <SearchBox
              onSearch={onSearch}
              value={searchVal}
              searchbox={styles.search_box_input}
              size="small"
              placeholder="Search Project List"
              width={isMobile ? '200px' : '242px'}
              style={isMobile ? { flex: 1 } : {}}
            />
          </Grid>
          <Grid style={{ display: 'flex', gap: '5px' }}>
            {permissions?.isCreate && permissions?.isUpdate && (
              <Button
                variant={isMobile ? 'text' : 'contained'}
                color="primary"
                size="small"
                onClick={onCreate}
                className={isMobile ? 'mobile_button' : styles.add_submit_btn}
                startIcon={isMobile ? null : <AddOutlined />}
              >
                {isMobile ? <MdAdd size={23} /> : 'Add'}
              </Button>
            )}
            {(permissions?.isDelete || permissions?.isUpdate) && (
              <>
                <Button
                  variant={isMobile ? 'text' : 'outlined'}
                  color="default"
                  size="small"
                  disabled={canDelete}
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
                  {permissions?.isDelete && (
                    <MenuItem
                      disabled={canDelete}
                      onClick={() => {
                        showConfirmBox(null);
                        closeActions();
                      }}
                    >
                      Delete
                    </MenuItem>
                  )}
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
                            let entities = [];
                            selectedRecords.map((current) => {
                              if (current?.entity) {
                                if (current?.entityId) {
                                  entities.push(current?.entityId);
                                }
                                if (current?.restentity) {
                                  let restEntities = current?.restentity.map((o) => o.optionValue);
                                  entities = [...entities, ...restEntities];
                                }
                              }
                            });
                            setEntities([...entities]);
                          }
                          setShowEntityDialog(true);
                        }
                      }}
                    >
                      Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ProjectStrategyHeader;
