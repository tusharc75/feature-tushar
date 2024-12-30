import { Box, Menu, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import SearchBox from '../../components/Helpers/SearchBox';

import styles from '../Leads/Header.module.scss';
import { ThemeButton } from 'src/components/Helpers/Buttons';

function DoaHeader(props) {
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const { onSearch, searchVal, DoaPermissions, showConfirmBox, canDelete, icon, heading } = props;
  return (
    <Grid className={styles.filter_side_container} container>
      <Grid size={{xs:6}} className="d-flex align-items-center gap-1">
        {icon} <span className="listingHeader">{heading}</span>
      </Grid>
      <Grid size={{xs:6}} className={styles.filter_side}>
        <Box className={styles.filter_side_header} component="div">
          <SearchBox onChange={onSearch} value={searchVal} width="242px" />

          {DoaPermissions.isDelete && (
            <>
              <ThemeButton
                disabled={canDelete}
                mobileTooltip="Actions"
                borderColor="yellow"
                backgroundColor="yellow"
                onClick={openActions}
                endIcon={<ExpandMore />}
                iconForMobile={<ExpandMore />}
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
                >
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}
export default DoaHeader;
