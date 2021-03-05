import React, { useEffect, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import {
  Grid, Link, Divider,
  Typography,
  Grid, Divider
} from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import Header from "./Header";

import Layout from "../../components/Layout";
import Container from "../../components/Container";
import { Link } from 'react-router-dom'
import CreateLeadDialog from './CreateLead'
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import SearchBox from "../../components/Helpers/SearchBox";
import "./style.css";

const useStyles = makeStyles((theme) => ({
  footerText: {
    textAlign: "center",
  },
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.textDark
  },
  linkDivider: {
    backgroundColor: theme.palette.darkBg,
    margin: "0 1rem",
  }
}));

const LeadTypes = {
  "All Accounts": 1,
  "My Accounts": 2,
};
const Leads = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [age, setAge] = useState("All");
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchVal, setSearchVal] = useState("");
  const [selectedType, setselectedType] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState({ page: 0, limit: 25 });


  const handleChange = (event) => {
    setAge(event.target.value);
  };

  const buttonProps = [
    { title: "New Lead", bg: theme.palette.darkBg, color: "#fff" },
    { title: "Delete Lead", bg: theme.palette.lightBg, color: "#fff" },
  ];

  const handleLeadTypeSel = (e) => {
    setselectedType(e.target.value);
  };
  const handleSearch = (e) => {
    if (query.page !== 1) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
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

      <Container>
        <Header
          selectedType={selectedType}
          onTypeChange={handleLeadTypeSel}
          options={LeadTypes}
          onSearch={handleSearch}
          searchVal={searchVal}
          onCreate={handleCreate}
        />
        <CreateLeadDialog
          open={isOpen}
          onClose={handleClose}
        />
      </Container>
    </Layout>
  );
};

export default Leads;
