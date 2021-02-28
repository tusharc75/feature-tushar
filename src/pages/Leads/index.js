import React, { useState } from "react";
import { makeStyles, withStyles, useTheme } from "@material-ui/core/styles";
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
  Select,
  Checkbox,
  MenuItem,
  FormControl,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
} from "@material-ui/core";
import { FilterList, SortByAlpha, Search } from "@material-ui/icons";
import "./style.css";

import Layout from "../../components/Layout";
import Container from "../../components/Container";
import NavLinks from "../../components/NavLinks";

const useStyles = makeStyles((theme) => ({
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

  lead: {
    display: "flex",
    alignItems: "center",
  },

  leadAvatar: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    marginRight: 10,
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

const Leads = () => {
  const theme = useTheme();

  const classes = useStyles();
  const [age, setAge] = useState("All");

  const handleChange = (event) => {
    setAge(event.target.value);
  };

  const buttonProps = [
    { title: "New Lead", bg: theme.palette.darkBg, color: "#fff" },
    { title: "Delete Lead", bg: theme.palette.lightBg, color: "#fff" },
  ];
  return (
    <Layout>
      {/* Links Section */}
      <NavLinks ButtonProps={buttonProps} />

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
                <MenuItem value="All">All Leads</MenuItem>
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
                placeholder="Search Leads"
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
                    "Lead Name",
                    "Company",
                    "Title",
                    "Lead Source",
                    "Phone Number",
                    "Owner",
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
                  <StyledTableCell>
                    <Box component="div" className={classes.lead}>
                      <Avatar className={classes.leadAvatar}>A</Avatar>
                      <Box component="div">
                        <Typography variant="subtitle2">Ava Moore</Typography>
                        <Typography variant="caption" color="textSecondary">
                          ava@ppcollc.com
                        </Typography>
                      </Box>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>Platinum Pipelines Co LLC</StyledTableCell>
                  <StyledTableCell>Cast Accountant</StyledTableCell>
                  <StyledTableCell>Web Download</StyledTableCell>
                  <StyledTableCell>281-281-2345</StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="subtitle2">Ava Moore</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Dec 7, 2020 11:44pm
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      inputProps={{ "aria-label": "select all desserts" }}
                    />
                  </TableCell>
                  <StyledTableCell>
                    <Box component="div" className={classes.lead}>
                      <Avatar className={classes.leadAvatar}>B</Avatar>
                      <Box component="div">
                        <Typography variant="subtitle2">
                          Beth Petterson
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          beth@distribution.com
                        </Typography>
                      </Box>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>Morlong Distribution</StyledTableCell>
                  <StyledTableCell>Executive Secretary</StyledTableCell>
                  <StyledTableCell>Seminar Partner</StyledTableCell>
                  <StyledTableCell>555-555-5555</StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="subtitle2">Beth Petterson</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Dec 7, 2020 11:44pm
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      inputProps={{ "aria-label": "select all desserts" }}
                    />
                  </TableCell>
                  <StyledTableCell>
                    <Box component="div" className={classes.lead}>
                      <Avatar className={classes.leadAvatar}>D</Avatar>
                      <Box component="div">
                        <Typography variant="subtitle2">
                          David Henderson
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          david@chapman.com
                        </Typography>
                      </Box>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>Chapmam Piping, Canada</StyledTableCell>
                  <StyledTableCell>Computer System Analyst</StyledTableCell>
                  <StyledTableCell>Online Store</StyledTableCell>
                  <StyledTableCell>654-987-9876</StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="subtitle2">David Henderson</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Dec 7, 2020 11:44pm
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      inputProps={{ "aria-label": "select all desserts" }}
                    />
                  </TableCell>
                  <StyledTableCell>
                    <Box component="div" className={classes.lead}>
                      <Avatar className={classes.leadAvatar}>J</Avatar>
                      <Box component="div">
                        <Typography variant="subtitle2">James Smith</Typography>
                        <Typography variant="caption" color="textSecondary">
                          james@pacman.com
                        </Typography>
                      </Box>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>Pacman Co</StyledTableCell>
                  <StyledTableCell>Cast Accountant</StyledTableCell>
                  <StyledTableCell>Partner</StyledTableCell>
                  <StyledTableCell>456-678-4567</StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="subtitle2">James Smith</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Dec 7, 2020 11:44pm
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      inputProps={{ "aria-label": "select all desserts" }}
                    />
                  </TableCell>
                  <StyledTableCell>
                    <Box component="div" className={classes.lead}>
                      <Avatar className={classes.leadAvatar}>R</Avatar>
                      <Box component="div">
                        <Typography variant="subtitle2">
                          Rachel Jones
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          rachel@grayson.com
                        </Typography>
                      </Box>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>Grayson</StyledTableCell>
                  <StyledTableCell>Office Assistant</StyledTableCell>
                  <StyledTableCell>External Referral</StyledTableCell>
                  <StyledTableCell>281-281-2345</StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="subtitle2">Rachel Jones</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Dec 7, 2020 11:44pm
                    </Typography>
                  </StyledTableCell>
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
    </Layout>
  );
};

export default Leads;
