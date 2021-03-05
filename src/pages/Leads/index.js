import React, { useState } from "react";
import { makeStyles, withStyles, useTheme } from "@material-ui/core/styles";
import {
  Typography,
  TableCell,
  TableRow,
} from "@material-ui/core";
import Header from './Header'
import "./style.css";
import LeadTable from './Table'
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import NavLinks from "../../components/NavLinks";

const useStyles = makeStyles((theme) => ({
  footerText: {
    textAlign: "center",
  },
}));

const LeadTypes = {
  "All Accounts": 1,
  "My Accounts": 2
}
const Leads = () => {
  const theme = useTheme();

  const classes = useStyles();
  const [age, setAge] = useState("All");
  const [searchVal, setSearchVal] = useState("");
  const [selectedType, setselectedType] = useState(1)
  const [query, setQuery] = useState({ page: 0, limit: 25 });

  const handleChange = (event) => {
    setAge(event.target.value);
  };

  const buttonProps = [
    { title: "New Lead", bg: theme.palette.darkBg, color: "#fff" },
    { title: "Delete Lead", bg: theme.palette.lightBg, color: "#fff" },
  ];

  const handleLeadTypeSel = (e) => {
    setselectedType(e.target.value)
  }
  const handleSearch = (e) => {
    if (query.page !== 1) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  return (
    <Layout>
      {/* Links Section */}
      <NavLinks ButtonProps={buttonProps} />

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

      <Typography
        component="div"
        className={classes.footerText}
        variant="subtitle1"
        color="textSecondary"
      >
        &copy; 2020, equipt.com, Inc, or its affiliates
      </Typography>
    </Layout>
  );
};

export default Leads;
