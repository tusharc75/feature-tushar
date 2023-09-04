import { Button, IconButton } from '@material-ui/core';
import { AddOutlined } from '@material-ui/icons';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { TbArrowsSort } from 'react-icons/tb';
import routes from 'src/components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import styles from '../Leads/Header.module.scss';

function RepairJobHeader(props) {
  const {
    selectedRecords,
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    RepairJobPermissions,
    showConfirmBox,
    canDelete,
    icon,
    heading,
    children,
    showTransferEntityDialog,
    selectedType,
    columns,
    dispatch,
    filters,
    resource = ''
    // showCloneRentalManagementDialog
  } = props;

  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const [filter, setFilter] = useState(options[0].key);

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  const [isOpenDialog, setisOpenDialog] = useState(false);

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = useState(false);

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className={'d-flex flex-wrap align-items-center gap-1 w-full'}>
        {isMobile && !isTablet && (
          <>
            <div className="d-flex flex-wrap items-center justify-between w-full">
              <div>{toggleInner}</div>
              <div className="flex flex-wrap items-center gap-1">
                <IconButton
                  size="small"
                  className={'mobileIconButton secondary'}
                  onClick={handleClickOpen}
                  id="demo-customized-button"
                  aria-controls="demo-customized-menu"
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  style={isTablet ? { marginLeft: '50px' } : {}}
                >
                  <TbArrowsSort className="rotate-90" size={16} />
                </IconButton>

                <MobileSortDialog
                  isOpen={open}
                  handleClose={handleClickClose}
                  contentPart={''}
                  secHeading={['Sort Repair Job']}
                  columns={columns}
                  dispatch={dispatch}
                />

                <IconButton
                  size="small"
                  onClick={handleOpen}
                  id="demo-customized-button"
                  aria-controls="demo-customized-menu"
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  className={'mobileIconButton secondary'}
                >
                  <MdOutlineFilterAlt size={16} />
                </IconButton>
                <MobileFilterDialog
                  isOpen={isOpenDialog}
                  handleClose={handleClose}
                  contentPart={''}
                  columns={columns}
                  dispatch={dispatch}
                  title={routes?.repairJob?.title}
                  filters={filters}
                  resource={resource}
                />
              </div>
            </div>
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
        {children}
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />

        <div className="flex gap-[8px] flex-wrap items-center">
          {RepairJobPermissions?.isCreate && RepairJobPermissions?.isUpdate && (
            <Button variant={'contained'} color="primary" size="small" onClick={onCreate} className={`no-shadow`} startIcon={<AddOutlined />}>
              Add
            </Button>
          )}
        </div>
      </div>
      <DisplayFiltersForMobile resource={resource} />
    </div>
  );
}

export default RepairJobHeader;
