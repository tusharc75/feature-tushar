import React, { useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Box,
  Button,
  Grid,
  Link,
  Divider,
  Menu,
  MenuItem,
  Select
} from "@material-ui/core";
import { Add, ExpandMore } from "@material-ui/icons";
import { DataGrid } from "@material-ui/data-grid";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import SearchBox from "../../components/Helpers/SearchBox";
import CreateLeadDialog from './CreateLead'

import "./style.css";

const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.textDark,
  },
  linkDivider: {
    backgroundColor: theme.palette.darkBg,
    margin: "0 1rem",
  },
}));

const LeadTypes = {
  "All Leads": 1,
  "My Leads": 2,
};

const Leads = () => {
  const classes = useStyles();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedType, setSelectedType] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  const handleSearch = (e) => {
    if (query.page !== 1) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleLeadTypeSel = (e) => {
    setSelectedType(e.target.value);
  };

  const handleCreate = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <Layout>
      <Grid container spacing={3} direction="row">
        <Grid item xs={12} sm={6} className="pl-3">
          <CustomBreadCrumbs routes={[routes.lead]} />
        </Grid>
        <Grid item xs={12} sm={6} className="pr-3">
          <Grid container justify="flex-end">
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Import from Excel
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Export to Excel
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Download Template
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Email a Link
            </Link>
          </Grid>
        </Grid>
      </Grid>

      {/* Tables Begins Here */}
      <Container>
        <Grid container justify="space-between">
          <Grid item>
            {
              Object.keys(LeadTypes).length ? <Select
                style={{ width: '160px' }}
                displayEmpty
                labelId="demo-simple-select-outlined-label"
                inputProps={{ "aria-label": "Without label" }}
                id="demo-simple-select-outlined"
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left"
                  },
                  getContentAnchorEl: null
                }}
                value={selectedType}
                onChange={handleLeadTypeSel}
                label="Select Type"
              >
                {
                  Object.keys(LeadTypes).map((k, index) => {
                    return <MenuItem key={index} value={LeadTypes[k]}>{k}</MenuItem>
                  })
                }
              </Select>
                : null
            }
          </Grid>

          <Grid item>
            <SearchBox onSearch={handleSearch} value={searchVal} size="small" />
            <Box component="span" marginX={1} />

            <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleCreate}>
              Add
            </Button>

            <Box component="span" marginX={1} />

            <Button
              variant="outlined"
              color="default"
              aria-controls="action-menu"
              onClick={openActions}
            >
              Actions <ExpandMore />
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
              <MenuItem>Delete</MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Container>

      <Container styles={{ minHeight: "calc(100vh - 210px)", padding: 10 }}>
        <div className="contact-grid-height1">
          <DataGrid columns={[]} rows={[]} />
        </div>
      </Container>

      <CreateLeadDialog
        open={isOpen}
        onClose={handleClose}
      />
    </Layout>
  );
};

export default Leads;