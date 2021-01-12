import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, TextField, Link } from "@material-ui/core";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import moment from "moment";

import SelectSearch from "react-select-search";
import BoxWithBorder from "../BoxWithBorder";
import { SVG } from "../../assets";

const useStyles = makeStyles((theme) => ({
  inputLable: {
    color: theme.palette.textLight,
  },
  input: {
    width: "100%",
    background: "#f8fafc",
    border: "none",
  },

  aiSide: {
    textAlign: "center",
    height: "100%",
  },

  inputMargin: {
    marginBottom: theme.spacing(4),
  },
}));

const OpportunityInformation = () => {
  const classes = useStyles();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [currency, setCurrency] = useState("");

  const handleCurrencyChange = (event) => setCurrency(event.target.value);

  const currencyOptions = [
    { name: "USD", value: "usd" },
    { name: "AUD", value: "aud" },
    { name: "INR", value: "inr" },
  ];

  const bussinessTypeOptions = [
    { name: "New Business", value: "new" },
    { name: "Existing Business", value: "existing" },
  ];

  const salesPersonOptions = [
    { name: "John Smith", value: "john-smith" },
    { name: "Jack Sparrow", value: "jack-sparrow" },
    { name: "Robert Plan", value: "robert-plan" },
    { name: "Suranne Ross", value: "suranne-ross" },
    { name: "Kari Hines", value: "kari-hines" },
  ];

  return (
    <div>
      <MuiPickersUtilsProvider libInstance={moment} utils={MomentUtils}>
        {/* Left Side Box */}
        <Grid container spacing={2}>
          <Grid item sm={12} md={7}>
            <BoxWithBorder>
              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Opportunity Name
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Target Close Date
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <KeyboardDatePicker
                    clearable
                    inputVariant="outlined"
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    format="Mon DD, YYYY"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Add Currency
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={6}
                  lg={5}
                  className={classes.selectInput}
                >
                  <SelectSearch
                    onChange={handleCurrencyChange}
                    search
                    options={currencyOptions}
                    value={currency}
                    name="language"
                    placeholder="Select Currency"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Purchase Timeframe
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={6}
                  lg={5}
                  className={classes.selectInput}
                >
                  <SelectSearch
                    search
                    options={salesPersonOptions}
                    placeholder="Select Purchase Timeframe"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Est. Revenue
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="$"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Probability(%)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    placeholder="_ _ _%"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>Type</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <SelectSearch
                    search
                    options={bussinessTypeOptions}
                    placeholder="Select Type"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Sales Person
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <SelectSearch
                    search
                    options={salesPersonOptions}
                    placeholder="Select Person"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}>
                  <Link className={classes.inputLable}>
                    Create a new sales person
                  </Link>
                </Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Details
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="_ _ _"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>
            </BoxWithBorder>

            <div style={{ marginBottom: 20 }} />
            {/* Bottom Box */}
            <BoxWithBorder>
              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Current Situation
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="_ _ _"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Customer Needs
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="_ _ _"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>

              {/* New Input */}
              <Grid
                container
                spacing={2}
                alignItems="center"
                className={classes.inputMargin}
              >
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <Typography className={classes.inputLable}>
                    Proposed Solution
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={5}>
                  <TextField
                    className={classes.input}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="_ _ _"
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
              </Grid>
            </BoxWithBorder>
          </Grid>

          {/* Right Side Box */}
          <Grid item sm={12} md={5} className={classes.aiSide}>
            <BoxWithBorder>
              <Typography variant="h6" style={{ marginBottom: 20 }}>
                AI Assitant
              </Typography>
              <img src={SVG("AI Robot")} alt="AI Robot" />
              <Typography style={{ marginTop: 50 }}>
                To enable AI assistant save this opportunity
              </Typography>
            </BoxWithBorder>
          </Grid>
        </Grid>
      </MuiPickersUtilsProvider>
    </div>
  );
};

export default OpportunityInformation;
