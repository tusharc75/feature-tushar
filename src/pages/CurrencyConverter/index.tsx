import React, { useEffect, useState, useContext, Fragment } from "react";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import Grid from "@material-ui/core/Grid";
import Button from '@material-ui/core/Button';
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { Autocomplete } from "@material-ui/lab";
import { Avatar, Box, TextField, Typography } from "@material-ui/core";
import Loader from "../../components/Loader";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomContainer from "../../components/CustomContainer";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { FaWpforms } from 'react-icons/fa';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import currencyList from "../../constants/currency_with_country.json";
import CustomButton from '../../components/Helpers/CustomButton'

const useStyles = makeStyles((theme) => ({
  tdWidth: {
    maxWidth: 120,
    minWidth: 120
  },
}));



const CurrencyConverter = () => {

  const toastConfig = useContext(CustomToastContext)
  const [currency, setCurrency] = useState([]);
  const [isApiUpdate, setIsApiUpdate] = useState(false);
  const [option, setOption] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConverter();
  }, []);

  const fetchConverter = () => {
    axiosInstance().get(`/converter?type=currency`).then(({ data: { data } }) => {
      setCurrency(data.currency)
      setOption(data.option)
      setIsApiUpdate(data.isApiUpdate)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };


  const handleUpdate = () => {

    if (option.length === 0) {
      toastConfig.setToastConfig({ open: true, type: "error", message: "Please select currency" });
      return false
    }

    let is_valid = true;
    option.forEach((_option) => {
      for (var _currency in _option) {
        if (!_option[_currency] || _option[_currency] === "") {
          is_valid = false
          return;
        }
      }
    });
    if (!is_valid) {
      toastConfig.setToastConfig({ open: true, type: "error", message: "Please enter currency values" });
      return false
    }

    let data: any = {}
    data.type = "currency"
    data.currency = currency
    data.isApiUpdate = isApiUpdate
    data.option = option

    axiosInstance().post(`/converter`, data).then(() => {
      toastConfig.setToastConfig({
        open: true,
        type: "success",
        message: "Update Sucessfully",
      });
      fetchConverter()
    }).catch((error) => {
      toastConfig.setToastConfig(error)
    });
  }


  const onChangeValue = (index, fieldName, value) => {
    let data = [...option]
    data[index][fieldName] = value
    setOption(data)
  };

  const handleChange = (value) => {
    setCurrency(value)
    let data = [...option]
    let newOptions = []
    value.forEach((_unit, index) => {
      let row = {}
      value.forEach((__unit, i) => {
        row[__unit] = (data && data[index] && data[index][__unit]) ? data[index][__unit] : ""
      })
      newOptions.push(row)
    });
    setOption(newOptions)
  }


  const getcurrencyrates = () => {
    setLoading(true)
    axiosInstance().post(`/converter/getcurrencyrates`, { currency: currency }).then(({ data: { data } }) => {
      setOption(data)
      setLoading(false)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  }

  const classes = useStyles();

  return (
    <Layout>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[routes.currencyConverter]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
              <FaWpforms /> <span className="listingHeader">{routes.currencyConverter.title}</span>
            </Grid>
            <Grid xs={6} container justify="flex-end">
              <Button onClick={handleUpdate} variant="contained" size="small" color="primary" >Update</Button>
            </Grid>
          </Grid>
        </div>
        <div className="listing-grid">
          <Box p={1}>
            <Grid container className="greyBox">
              <Grid item xs={6}>
                <Autocomplete
                  multiple
                  id="tags-filled"
                  options={[...new Set(currencyList.map((_c) => { return _c.currencyCode }))]}
                  getOptionLabel={(option) => option}
                  value={currency}
                  renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  onChange={(e, value) => handleChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      variant="outlined"
                      label="Currency in use"
                      placeholder="Currency in use" />
                  )}
                  renderOption={(option) => {
                    const { currencyCode, symbol, name } = currencyList.find(d => d.currencyCode === option);
                    return `${currencyCode} - ${name} - (${symbol})`
                  }}
                  // renderOption={(option) => {
                  //   const { currencyCode, name, countryCode, symbolNative } = currencyList.find(d => d.currencyCode === option);
                  //   return (
                  //     <Grid container alignItems="center">
                  //       <Grid item>
                  //         <Avatar
                  //           variant="rounded"
                  //           src={`https://lipis.github.io/flag-icon-css/flags/4x3/${countryCode.toLowerCase()}.svg`}
                  //           style={{ marginRight: 20, width: "40px", height: "30px" }}
                  //         />
                  //       </Grid>
                  //       <Grid item xs>
                  //         <Typography>
                  //           {currencyCode} ({symbolNative})
                  //         </Typography>
                  //         <Typography variant="body2" color="textSecondary">
                  //           {name}
                  //         </Typography>
                  //       </Grid>
                  //     </Grid>
                  //   );
                  // }}
                  />
              </Grid>
              <Grid xs={6} container justify="flex-end">
                <FormControlLabel
                  control={
                    <Checkbox
                      name="required"
                      checked={isApiUpdate}
                      onChange={(e) => setIsApiUpdate(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto Update Daily Through API"
                />
              </Grid>
            </Grid>
          </Box>
          <Box p={1}>
            {(option && option.length > 0) &&
              <Fragment>
                <Grid container>
                  <Grid xs={12} container justify="flex-end">
                    <CustomButton
                      loading={loading}
                      variant="contained"
                      color="primary"
                      onClick={getcurrencyrates}
                      size="small"
                    > Fetch Rates</CustomButton>
                  </Grid>
                </Grid>
                <Box mt={1} border={1} p={1} borderColor="grey.300"  >
                  <table>
                    <thead>
                      <tr>
                        <th>
                        </th>
                        {currency.map((_unit, index) => (
                          <th key={index} className={classes.tdWidth}>{_unit}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currency.map((_unit, i) => (
                        <tr key={i}>
                          <th style={{ paddingRight: 10 }}>
                            {_unit}
                          </th>
                          {currency.map((_unit, index) => (
                            <td className={classes.tdWidth} key={index}>
                              <TextField
                                id="standard-basic"
                                type="number"
                                variant="outlined"
                                margin="dense"
                                fullWidth
                                style={{ margin: 0 }}
                                value={option && option[i] && option[i][_unit]}
                                onChange={(event) => onChangeValue(i, _unit, parseFloat(event.target.value))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Fragment>}
          </Box>
        </div>
      </CustomContainer>
    </Layout>
  );
};

export default CurrencyConverter;
