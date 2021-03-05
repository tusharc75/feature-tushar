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
} from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { Add, ExpandMore } from "@material-ui/icons";

import Layout from "../../components/Layout";
import Container from "../../components/Container";
import SearchBox from "../../components/Helpers/SearchBox";
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

const Opportunities = () => {
  const classes = useStyles();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);

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

  return (
    <Layout>
      <Grid container spacing={3} direction="row">
        <Grid item xs={12} sm={6} className="pl-3"></Grid>
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
          <Grid item></Grid>

          <Grid item>
            <SearchBox onSearch={handleSearch} value={searchVal} size="sm" />
            <Box component="span" marginX={1} />

            <Button variant="contained" color="primary" startIcon={<Add />}>
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
    </Layout>
  );
};

export default Opportunities;
