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
import { Skeleton } from "@material-ui/lab";
import { Add, ExpandMore, ControlPoint } from "@material-ui/icons";

import OpportunityInAccordian from "../../components/OpportunityInAccordian/OpportunityInAccordian";
import QuotesInAccordion from "../../components/QuotesInAccordion/QuotesInAccordion";
import ProductBuilderInAccordion from "../../components/ProductBuilderInAccordion/ProductBuilderInAccordion";
import LeadInAccordion from "../../components/LeadsInAccordion/LeadsInAccordion";
import BoxWithBorder from "../../components/BoxWithBorder";

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
    background: "#FFF",
    marginBottom: 12,
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
  const [relatedContactsLoading, setRelatedContactsLoading] = useState(true);

  const [contacts, setContacts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  const customers = [
    { title: "Customer 1", id: "fdf342" },
    { title: "Customer 2", id: "434erf" },
    { title: "Customer 3", id: "223red" },
    { title: "Customer 4", id: "d23dsf" },
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
          <Box
            display="flex"
            alignItems="center"
            className={clsx(classes.expand, {
              [classes.expandOpen]: expandedParent,
            })}
          >
            <ExpandMore />
          </Box>
          <Box component="span" mx={1} />
          <Typography>Customer Strategy</Typography>
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
          <Box width="100%">
            <>
              <Tabs
                variant="scrollable"
                scrollButtons="auto"
                className="oms-tab"
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
                <Box mt={2} hidden={currentTabIndex !== c.index}>
                  <Grid container spacing={1}>
                    {/**
                     * LEFT SIDE
                     */}
                    <Grid item xs={12} sm={12} md={8} lg={8}>
                      {/*TODO: Heirarchy Table */}

                      <QuotesInAccordion />
                      <ProductBuilderInAccordion />
                      <LeadInAccordion />
                    </Grid>
                    {/**
                     * RIGHT SIDE
                     */}
                    <Grid item xs={12} sm={12} md={4} lg={4}>
                      <Paper style={{ overflow: "hidden" }}>
                        <Box style={{ padding: "0px", maxHeight: "450px" }}>
                          <Box
                            width="100%"
                            padding={1}
                            bgcolor="grey.200"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Typography variant="subtitle2">
                              Customer Contacts
                            </Typography>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {}}
                            >
                              <ControlPoint />
                            </IconButton>
                          </Box>
                          <Box padding={1}>
                            {relatedContactsLoading ? (
                              [1, 2].map((i) => (
                                <BoxWithBorder
                                  key={i}
                                  style={{ marginBottom: "8px" }}
                                >
                                  <Box padding={1}>
                                    <Skeleton
                                      variant="text"
                                      width="100px"
                                      height="20px"
                                    />
                                    <Box marginTop={1} />
                                    <Skeleton
                                      variant="text"
                                      width="100%"
                                      height="15px"
                                    />
                                  </Box>
                                </BoxWithBorder>
                              ))
                            ) : contacts.length ? (
                              <>
                                <Box marginY={1} />
                              </>
                            ) : (
                              <Box textAlign="center" padding={2}>
                                No Users
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
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
