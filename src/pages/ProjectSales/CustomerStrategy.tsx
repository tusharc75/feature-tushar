import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  withStyles,
  Grid,
  Typography,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails,
  makeStyles,
  Paper,
  Box,
  IconButton,
  Tabs,
  Tab,
} from "@material-ui/core";
import { Add, ExpandMore } from "@material-ui/icons";

const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
    boxShadow: "none",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, .03)",
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    marginBottom: -1,
    minHeight: 46,
    "&$expanded": {
      minHeight: 46,
    },
  },
  content: {
    "&$expanded": {
      margin: "12px 0",
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: "#fff",
  },
}))(MuiAccordionDetails);

const useStyles = makeStyles((theme) => ({
  root: {
    padding: "12px",
    background: "#FFF",
  },
  expand: {
    transform: "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
  addBtn: {
    marginLeft: "auto",
  },
}));

const CustomerStrategy = () => {
  const classes = useStyles();
  const [expandedParent, setExpandedParent] = useState(true);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const [allCustomers, setAllCustomers] = useState([]);

  const customers = [
    { title: "Customer 1", id: "fdf342" },
    { title: "Customer 2", id: "434erf" },
    { title: "Customer 3", id: "223red" },
    { title: "Customer 4", id: "d23dsf" },
    { title: "Customer 5", id: "f3g123f" },
    { title: "Customer 6", id: "39fd12d" },
    { title: "Customer 7", id: "32432fs" },
  ];

  useEffect(() => {
    if (customers.length) {
      const data = customers.map((c, i) => ({
        ...c,
        index: i,
      }));
      setAllCustomers(data);
    }
  }, []);

  return (
    <Paper className={classes.root}>
      <Accordion
        square={false}
        expanded={expandedParent}
        onChange={() => setExpandedParent(!expandedParent)}
      >
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          <Typography>Customer Strategy</Typography>
          <Box component="span" mx={1} />
          <Box
            display="flex"
            alignItems="center"
            className={clsx(classes.expand, {
              [classes.expandOpen]: expandedParent,
            })}
          >
            <ExpandMore />
          </Box>
          <IconButton
            color="primary"
            size="small"
            className={classes.addBtn}
            onClick={(e) => e.stopPropagation()}
          >
            <Add />
          </IconButton>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <>
              <Tabs
                variant="scrollable"
                scrollButtons="auto"
                // className="oms-tab"
                value={currentTabIndex}
                onChange={(index, newValue) => {
                  setCurrentTabIndex(newValue);
                }}
                indicatorColor="primary"
                textColor="primary"
                aria-label="icon tabs example"
              >
                {allCustomers.map((c, i) => (
                  <Tab
                    tabIndex={c.index}
                    label={c.title}
                    aria-controls={`a11y-tabpanel-${i}`}
                    id={`a11y-tab-${i}`}
                  />
                ))}
              </Tabs>

              {allCustomers.map((c) => (
                <Box hidden={currentTabIndex !== c.index}>
                  <Grid container spacing={1}>
                    {/**
                     * LEFT SIDE
                     */}
                    <Grid item xs={12} sm={12} md={8} lg={8}>
                      {/*TODO: Heirarchy Table */}
                    </Grid>
                    {/**
                     * RIGHT SIDE
                     */}
                    <Grid item xs={12} sm={12} md={4} lg={4}></Grid>
                  </Grid>
                </Box>
              ))}
            </>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default CustomerStrategy;
