import React, { useState } from "react";
import { makeStyles, useTheme, withStyles } from "@material-ui/core/styles";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { FilterList, SortByAlpha, Search } from "@material-ui/icons";

import Layout from "../../components/Layout";
import Container from "../../components/Container";
import NavLinks from "../../components/NavLinks";
import "./style.css";

const useStyles = makeStyles((theme) => ({
  table: {
    marginTop: 20,
  },
  filterSide: {
    display: "flex",
    justifyContent: "flex-end",
  },
  footerText: {
    textAlign: "center",
  },
}));

const StyledTableRow = withStyles((theme) => ({
  root: {
    "&:nth-of-type(odd)": {
      backgroundColor: "#F9FAFA",
    },
  },
}))(TableRow);

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const Opportunities = () => {
  const theme = useTheme();
  const classes = useStyles();
  const [age, setAge] = useState("All");

  const handleChange = (event) => {
    setAge(event.target.value);
  };

  const buttonProps = [
    { title: "New Opportunity", bg: theme.palette.darkBg, color: "#fff" },
    { title: "Delete Opportunity", bg: theme.palette.lightBg, color: "#fff" },
  ];

  return (
    <Layout>
      <Box component="div" className={classes.root}>
        {/* Links Section */}
        <NavLinks OpportunityDashboard={true} ButtonProps={buttonProps} />

        {/* Tables Begins Here */}
        <Container>
          <Grid container>
            <Grid item xs={6}>
              <FormControl style={{ minWidth: "170px" }}>
                <Select
                  value={age}
                  displayEmpty
                  onChange={handleChange}
                  inputProps={{ "aria-label": "Without label" }}
                >
                  <MenuItem value="All">All Opportunities</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} className={classes.filterSide}>
              <Box component="div">
                <IconButton>
                  <FilterList />
                </IconButton>
                <IconButton>
                  <SortByAlpha />
                </IconButton>
                <TextField
                  id="outlined-search"
                  type="search"
                  placeholder="Search Opportunities"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="disabled" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </Grid>
          <Paper elevation={1}>
            <TableContainer className={classes.table}>
              <Table stickyHeader arial-lable="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    {[
                      "Opportunity Name",
                      "Potential Customer",
                      "Opportunity Date",
                      "Targeted Close Date",
                      "Type",
                      "Status",
                      "Est. Revenue",
                      "Sales Person",
                    ].map((item, i) => (
                      <TableCell key={i} align="left">
                        {item}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <StyledTableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    <StyledTableCell>DistributionNOW, USA</StyledTableCell>
                    <StyledTableCell>Dan</StyledTableCell>
                    <StyledTableCell>Dec 1, 2020</StyledTableCell>
                    <StyledTableCell>Dec 31, 2020</StyledTableCell>
                    <StyledTableCell>Existing business</StyledTableCell>
                    <StyledTableCell>RFQ to Supplier</StyledTableCell>
                    <StyledTableCell>$150,000.00</StyledTableCell>
                    <StyledTableCell>Jack Sparrow</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    <StyledTableCell>DNOW, Canada</StyledTableCell>
                    <StyledTableCell>Adam</StyledTableCell>
                    <StyledTableCell>Dec 10, 2020</StyledTableCell>
                    <StyledTableCell>Dec 31, 2020</StyledTableCell>
                    <StyledTableCell>Existing business</StyledTableCell>
                    <StyledTableCell>Propose</StyledTableCell>
                    <StyledTableCell>$950,000.00</StyledTableCell>
                    <StyledTableCell>Jack Sparrow</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    <StyledTableCell>Federal Steel Supply INC</StyledTableCell>
                    <StyledTableCell>Ava Moore</StyledTableCell>
                    <StyledTableCell>Dec 15, 2020</StyledTableCell>
                    <StyledTableCell>Dec 31, 2020</StyledTableCell>
                    <StyledTableCell>Existing business</StyledTableCell>
                    <StyledTableCell>Closed Won</StyledTableCell>
                    <StyledTableCell>$100,000.00</StyledTableCell>
                    <StyledTableCell>Jack Sparrow</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    <StyledTableCell>InduSteel</StyledTableCell>
                    <StyledTableCell>Beth Peterson</StyledTableCell>
                    <StyledTableCell>Dec 15, 2020</StyledTableCell>
                    <StyledTableCell>Dec 31, 2020</StyledTableCell>
                    <StyledTableCell>Existing business</StyledTableCell>
                    <StyledTableCell>Propose</StyledTableCell>
                    <StyledTableCell>$809,000.00</StyledTableCell>
                    <StyledTableCell>Jack Sparrow</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    <StyledTableCell>
                      American Piping Products INC
                    </StyledTableCell>
                    <StyledTableCell>David Henderson</StyledTableCell>
                    <StyledTableCell>Dec 1, 2020</StyledTableCell>
                    <StyledTableCell>Dec 31, 2020</StyledTableCell>
                    <StyledTableCell>Existing business</StyledTableCell>
                    <StyledTableCell>RFQ to Supplier</StyledTableCell>
                    <StyledTableCell>$75,000.00</StyledTableCell>
                    <StyledTableCell>Jack Sparrow</StyledTableCell>
                  </StyledTableRow>

                  <StyledTableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        inputProps={{ "aria-label": "select all desserts" }}
                      />
                    </TableCell>
                    <StyledTableCell>
                      American Piping Products INC
                    </StyledTableCell>
                    <StyledTableCell>James Smith</StyledTableCell>
                    <StyledTableCell>Dec 1, 2020</StyledTableCell>
                    <StyledTableCell>Dec 19, 2020</StyledTableCell>
                    <StyledTableCell>New business</StyledTableCell>
                    <StyledTableCell>Closed Lost</StyledTableCell>
                    <StyledTableCell>$110,000.00</StyledTableCell>
                    <StyledTableCell>Jack Sparrow</StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={6}
            page={0}
            rowsPerPage={10}
            onChangePage={() => console.log("page changed")}
          />
        </Container>

        <Typography
          component="div"
          className={classes.footerText}
          variant="subtitle1"
          color="textSecondary"
        >
          &copy; 2020, equipt.com, Inc, or its affiliates
        </Typography>
      </Box>
    </Layout>
  );
};

export default Opportunities;
