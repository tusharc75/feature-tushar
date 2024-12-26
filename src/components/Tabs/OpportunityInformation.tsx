import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Grid, Typography, TextField, Link, Theme } from '@mui/material';
import BoxWithBorder from '../BoxWithBorder';
import { SVG } from '../../assets';
import CustomDatePicker from 'src/components/CustomDatePicker';

const useStyles = makeStyles((theme: Theme) => ({
  inputLable: {
    color: theme.palette.primary.light //  textLight
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: 'none'
  },

  aiSide: {
    textAlign: 'center',
    height: '100%'
  },

  inputMargin: {
    marginBottom: theme.spacing(4)
  }
}));

const OpportunityInformation = () => {
  const classes = useStyles();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [currency, setCurrency] = useState('');

  const handleCurrencyChange = (event) => setCurrency(event.target.value);

  const currencyOptions = [
    { name: 'USD', value: 'usd' },
    { name: 'AUD', value: 'aud' },
    { name: 'INR', value: 'inr' }
  ];

  const bussinessTypeOptions = [
    { name: 'New Business', value: 'new' },
    { name: 'Existing Business', value: 'existing' }
  ];

  const salesPersonOptions = [
    { name: 'John Smith', value: 'john-smith' },
    { name: 'Jack Sparrow', value: 'jack-sparrow' },
    { name: 'Robert Plan', value: 'robert-plan' },
    { name: 'Suranne Ross', value: 'suranne-ross' },
    { name: 'Kari Hines', value: 'kari-hines' }
  ];

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item sm={12} md={7}>
          <BoxWithBorder>
            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Opportunity Name</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" placeholder="_ _ _" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Target Close Date</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <CustomDatePicker
                  value={selectedDate}
                  onChange={(date: any) => setSelectedDate(date)}
                  minDate={new Date()}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Add Currency</Typography>
              </Grid>
              <Grid
                item
                xs={12}
                sm={6}
                md={6}
                lg={5}
              // className={classes.selectInput}
              >
                {/* <SelectSearch
                    onChange={handleCurrencyChange}
                    search
                    options={currencyOptions}
                    value={currency}
                    // name="language"
                    placeholder="Select Currency"
                  /> */}
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Purchase Timeframe</Typography>
              </Grid>
              <Grid
                item
                xs={12}
                sm={6}
                md={6}
                lg={5}
              // className={classes.selectInput}
              >
                {/* <SelectSearch
                    search
                    options={salesPersonOptions}
                    placeholder="Select Purchase Timeframe"
                  /> */}
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Est. Revenue</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" placeholder="$" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Probability(%)</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" placeholder="_ _ _%" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Type</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                {/* <SelectSearch
                    search
                    options={bussinessTypeOptions}
                    placeholder="Select Type"
                  /> */}
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Sales Person</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                {/* <SelectSearch
                    search
                    options={salesPersonOptions}
                    placeholder="Select Person"
                  /> */}
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}>
                <Link className={classes.inputLable}>Create a new sales person</Link>
              </Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Details</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" multiline rows={4} placeholder="_ _ _" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>
          </BoxWithBorder>

          <div style={{ marginBottom: 20 }} />
          {/* Bottom Box */}
          <BoxWithBorder>
            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Current Situation</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" multiline rows={4} placeholder="_ _ _" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Customer Needs</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" multiline rows={4} placeholder="_ _ _" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={4}></Grid>
            </Grid>

            {/* New Input */}
            <Grid container spacing={2} alignItems="center" className={classes.inputMargin}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Typography className={classes.inputLable}>Proposed Solution</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={5}>
                <TextField className={classes.input} variant="outlined" multiline rows={4} placeholder="_ _ _" />
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
            <img src={SVG('AI Robot')} alt="AI Robot" />
            <Typography style={{ marginTop: 50 }}>To enable AI assistant save this opportunity</Typography>
          </BoxWithBorder>
        </Grid>
      </Grid>
    </div>
  );
};

export default OpportunityInformation;
