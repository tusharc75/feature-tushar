import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Grid, Typography, TextField, FormControl, Select, MenuItem, Box, IconButton, InputAdornment } from '@mui/material';

import BoxWithBorder from '../BoxWithBorder';
import { SVG } from '../../assets';
import { Add, FilterList, SortByAlpha, Search } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  customers: {
    textAlign: 'center'
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  table: {
    marginTop: theme.spacing(4)
  }
}));

const Contacts = () => {
  const classes = useStyles();
  const [contacts, setContacts] = useState('All');

  const handleChange = (event) => {
    setContacts(event.target.value);
  };

  return (
    <div>
      {/* Left Side Box */}
      <Grid container spacing={2}>
        <Grid item sm={12} md={7}>
          {/* Customers Contact */}
          <BoxWithBorder>
            <Box className={classes.customers}>
              <Typography variant="h6" style={{ marginBottom: 20 }}>
                Customer
              </Typography>
              <Grid container justify="space-between">
                <Grid item>
                  <FormControl className={classes.formControl}>
                    <Select labelId="select-label" id="select" value={contacts} onChange={handleChange}>
                      <MenuItem value="All">All Contacts</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <IconButton>
                    <Add />
                  </IconButton>
                  <IconButton>
                    <FilterList />
                  </IconButton>
                  <IconButton>
                    <SortByAlpha />
                  </IconButton>
                  <TextField
                    id="outlined-search"
                    type="search"
                    placeholder="Search Contacts"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="disabled" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
              <Box className={classes.table}>
                <img src={SVG('Contacts Placeholder')} alt="Contacts" />
              </Box>
            </Box>
          </BoxWithBorder>

          <div style={{ marginBottom: 20 }} />

          {/* Customers Contact */}
          <BoxWithBorder>
            <Box className={classes.customers}>
              <Typography variant="h6" style={{ marginBottom: 20 }}>
                Supplier
              </Typography>
              <Grid container justify="space-between">
                <Grid item>
                  <FormControl className={classes.formControl}>
                    <Select labelId="select-label" id="select" value={contacts} onChange={handleChange}>
                      <MenuItem value="All">All Contacts</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <IconButton>
                    <Add />
                  </IconButton>
                  <IconButton>
                    <FilterList />
                  </IconButton>
                  <IconButton>
                    <SortByAlpha />
                  </IconButton>
                  <TextField
                    id="outlined-search"
                    type="search"
                    placeholder="Search Contacts"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="disabled" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
              <Box className={classes.table}>
                <img src={SVG('Contacts Placeholder')} alt="Contacts" />
              </Box>
            </Box>
          </BoxWithBorder>
        </Grid>

        {/* Right Side Box */}
        <Grid item sm={12} md={5}>
          <BoxWithBorder>
            <Typography variant="h6" style={{ marginBottom: 20 }}>
              Timeline
            </Typography>
            <img src={SVG('Timeline Placeholder')} alt="Timeline" />
          </BoxWithBorder>
        </Grid>
      </Grid>
    </div>
  );
};

export default Contacts;
