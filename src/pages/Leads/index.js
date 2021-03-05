import React, { useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { Typography, TableCell, TableRow } from "@material-ui/core";
import Header from "./Header";
import "./style.css";
import LeadTable from "./Table";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import SearchBox from "../../components/Helpers/SearchBox";
import "./style.css";

const useStyles = makeStyles((theme) => ({
  footerText: {
    textAlign: "center",
  },
}));

const LeadTypes = {
  "All Accounts": 1,
  "My Accounts": 2,
};
const Leads = () => {
  const classes = useStyles();
  const [age, setAge] = useState("All");
  const [searchVal, setSearchVal] = useState("");
  const [selectedType, setselectedType] = useState(1);
  const [query, setQuery] = useState({ page: 0, limit: 25 });

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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
        <Header
          selectedType={selectedType}
          onTypeChange={handleLeadTypeSel}
          options={LeadTypes}
          onSearch={handleSearch}
          searchVal={searchVal}
        />
        <LeadTable />
      </Container>
      <Container styles={{ minHeight: "calc(100vh - 210px)", padding: 10 }}>
        <div className="contact-grid-height1">
          <DataGrid columns={[]} rows={[]} />
        </div>
      </Container>
    </Layout>
  );
};

export default Leads;
