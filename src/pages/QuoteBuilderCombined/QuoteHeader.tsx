import { Menu, MenuItem } from '@mui/material';
import { AddOutlined, ExpandMore } from '@mui/icons-material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState } from 'react';
import { useData } from '../../StateProvider/Provider';
import SearchBox from '../../components/Helpers/SearchBox';
import { ThemeButton } from 'src/components/Helpers/Buttons';

function QuoteHeader({
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
  dispatch,
  filters,
  selectedType,
  resource = ''
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const {
    state: { permissions }
  }: any = useData();

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

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
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  let toggleInner = options && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={options[selectedType - 1].key} exclusive onChange={handleFilter}>
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className={'d-flex align-items-center gap-1'}>
        <div className="d-flex align-items-center">
          {icon} <span className="listingHeader">{heading}</span>
        </div>
        <ToggleButtonGroup size="small" className="ml-2" value={options[selectedType - 1].key} exclusive onChange={handleFilter}>
          {options.map((k, index) => {
            return (
              <ToggleButton value={k.key} key={index}>
                {k.key}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
        {children}
      </div>
      <div className="flex flex-wrap justify-end  gap-[8px]">
        <SearchBox onChange={onSearch} value={searchVal} />

        <div className="flex flex-wrap items-center gap-[8px]">
          {QuotePermissions.isCreate && (
            <ThemeButton
              mobileTooltip="Add"
              iconForMobile={<AddOutlined />}
              onClick={onCreate}
              startIcon={<AddOutlined />}
            >
              Add
            </ThemeButton>
          )}
          {(QuotePermissions.isCreate || QuotePermissions.isUpdate) && (
            <>
              <ThemeButton
                disabled={canDelete}
                mobileTooltip="Actions"
                borderColor="yellow"
                backgroundColor="yellow"
                iconForMobile={<ExpandMore />}
                onClick={openActions}
                endIcon={<ExpandMore />}
              >
                Actions
              </ThemeButton>
              <Menu
                anchorEl={anchorEl}
                keepMounted
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
                  disabled={!permissions?.quoteBuilder?.isDelete}
                >
                  Delete
                </MenuItem>
                {QuotePermissions.isUpdate && (
                  <MenuItem
                    disabled={selectedRecords.find((d) => d.canDelete === false)}
                    onClick={() => {
                      closeActions();
                      showTransferEntityDialog();
                    }}
                  >
                    Transfer Entity
                  </MenuItem>
                )}
                <MenuItem
                  disabled={selectedRecords.length !== 1}
                  onClick={() => {
                    closeActions();
                    showCloneQuoteDialog();
                  }}
                >
                  Clone
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default QuoteHeader;
