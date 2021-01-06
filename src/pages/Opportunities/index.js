import React, { useState } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import {
  Box,
  Typography,
  Link,
  Divider,
  Button,
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
import "./style.css";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    height: "100%",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
  },
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.textDark,
  },
  linkDivider: {
    backgroundColor: theme.palette.darkBg,
    margin: "0 1rem",

    "&:last-child": {
      display: "none",
    },
  },
  headButtons: {
    display: "flex",
  },
  newBtn: {
    textTransform: "none",
    background: theme.palette.darkBg,
    marginRight: 15,
    color: "white",

    "&:hover": {
      background: theme.palette.darkBg,
    },
  },
  deleteBtn: {
    textTransform: "none",
    background: theme.palette.lightBg,
    color: "white",

    "&:hover": {
      background: theme.palette.lightBg,
    },
  },
  tableContainer: {
    padding: "30px 20px",
    marginTop: 20,
    height: "88vh",
  },

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
  const classes = useStyles();
  const [age, setAge] = useState("All");

  const onLinkClick = (event) => event.preventDefault();

  const handleChange = (event) => {
    setAge(event.target.value);
  };

  return (
    <Box component="div" className={classes.root}>
      {/* Links Section */}
      <Grid container className={classes.head}>
        <Grid item>
          <Typography component="div" className={classes.linksContainer}>
            {[
              "Opportunities Dashboard",
              "Import from Excel",
              "Export to Excel",
              "Download Template",
              "Email a Link",
            ].map((item, i) => (
              <React.Fragment key={i}>
                <Link href="#" onClick={onLinkClick} className={classes.links}>
                  {item}
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  className={classes.linkDivider}
                />
              </React.Fragment>
            ))}
          </Typography>
        </Grid>

        <Grid item>
          <Box className={classes.headButtons}>
            <Button disableElevation className={classes.newBtn}>
              New Opportunity
            </Button>
            <Button disableElevation className={classes.deleteBtn}>
              Delete Opportunity
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Tables Begins Here */}
      <Paper elevation={0} className={classes.tableContainer}>
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
      </Paper>

      <Typography
        component="div"
        className={classes.footerText}
        variant="subtitle1"
        color="textSecondary"
      >
        &copy; 2020, equipt.com, Inc, or its affiliates
      </Typography>
    </Box>
  );
};

export default Opportunities;
