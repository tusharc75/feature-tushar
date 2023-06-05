import { useEffect, useState, useContext, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Autocomplete } from '@material-ui/lab';
import { Box, TextField } from '@material-ui/core';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import { FaWpforms } from 'react-icons/fa';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CustomButton from '../../components/Helpers/CustomButton';
import { getUniqueCurrencies } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { MdUpdate } from 'react-icons/all';

const useStyles = makeStyles(() => ({
  tdWidth: {
    maxWidth: 120,
    minWidth: 120
  }
}));

const CurrencyConverter = () => {
  const toastConfig = useContext(CustomToastContext);
  const [currency, setCurrency] = useState([]);
  const [isApiUpdate, setIsApiUpdate] = useState(false);
  const [option, setOption] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    state: { permissions }
  }: any = useData();
  const [currencyConverterPermissions, setCurrencyConverterPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });

  useEffect(() => {
    if (permissions && permissions?.currencyConverter) {
      setCurrencyConverterPermissions(permissions?.currencyConverter);
    }
  }, [permissions]);

  useEffect(() => {
    fetchConverter();
  }, []);

  const fetchConverter = () => {
    axiosInstance()
      .get(`/converter?type=currency`)
      .then(({ data: { data } }) => {
        setCurrency(data.currency);
        setOption(data.option);
        setIsApiUpdate(data.isApiUpdate);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdate = () => {
    if (option.length === 0) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: 'Please select currency' });
      return false;
    }

    let is_valid = true;
    option.forEach((_option) => {
      for (var _currency in _option) {
        if (!_option[_currency] || _option[_currency] === '') {
          is_valid = false;
          return;
        }
      }
    });
    if (!is_valid) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: 'Please enter currency values' });
      return false;
    }

    let data: any = {};
    data.type = 'currency';
    data.currency = currency;
    data.isApiUpdate = isApiUpdate;
    data.option = option;

    axiosInstance()
      .post(`/converter`, data)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Updated successfully'
        });
        fetchConverter();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onChangeValue = (index, fieldName, value) => {
    let data = [...option];
    data[index][fieldName] = value;
    setOption(data);
  };

  const handleChange = (value) => {
    setCurrency(value);
    let data = [...option];

    if (data.length > value.length) {
      let index = 0;
      let deleteindex = 0;
      for (var x in data[0]) {
        if (!value.includes(x)) {
          deleteindex = index;
        }
        index = index + 1;
      }
      data.splice(deleteindex, 1);
    }

    let newOptions = [];
    value.forEach((_unit, index) => {
      let row = {};
      value.forEach((__unit, i) => {
        row[__unit] = data && data[index] && data[index][__unit] ? data[index][__unit] : '';
      });
      newOptions.push(row);
    });
    setOption(newOptions);
  };

  const getcurrencyrates = () => {
    setLoading(true);
    axiosInstance()
      .post(`/converter/getcurrencyrates`, { currency: currency })
      .then(({ data: { data } }) => {
        setOption(data);
        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const classes = useStyles();

  const convertLabeltoValue = (value) => {
    const result = [];
    value.forEach((_v) => {
      let _data = getUniqueCurrencies().filter(
        (data) => data.currencyCode === _v || data.currencyCode + ' - ' + data.currencyName + ' - (' + data.symbolNative + ')' === _v
      );
      if (_data.length) {
        result.push(_data[0].currencyCode);
      }
    });
    return result;
  };

  const convertValuetoLabel = (value) => {
    const result = [];
    value.forEach((_v) => {
      let _data = getUniqueCurrencies().filter((data) => data.currencyCode === _v);
      if (_data.length) {
        result.push(_data[0].currencyCode + ' - ' + _data[0].currencyName + ' - (' + _data[0].symbolNative + ')');
      }
    });
    return result;
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[routes.currencyConverter]} />
        </Grid>
      </Grid>
      <CustomContainer styles={{ overflowY: 'auto' }}>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={6} md={6} sm={6} className="d-flex align-items-center gap-1"></Grid>
            <Grid xs={6} md={6} sm={6} container justify="flex-end">
              {currencyConverterPermissions.isUpdate && (
                <Button
                  onClick={handleUpdate}
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  size="small"
                  color="primary"
                  style={isMobile && !isTablet ? { color: 'var(--info)' } : {}}
                >
                  {' '}
                  {isMobile && !isTablet ? <MdUpdate size={20} /> : 'Update'}{' '}
                </Button>
              )}
            </Grid>
          </Grid>
        </div>
        <div className="listing-grid">
          <Box p={1}>
            <Grid
              container
              style={{
                background: 'var(--dark-secondary, rgb(241, 245, 255))',
                border: '1px solid var(--common-border-color)',
                padding: '10px 10px'
              }}
            >
              <Grid item xs={12} md={8} sm={8}>
                <Autocomplete
                  fullWidth
                  multiple
                  disableCloseOnSelect={true}
                  id="tags-filled"
                  options={getUniqueCurrencies().map((_c) => {
                    return _c.currencyCode + ' - ' + _c.currencyName + ' - (' + _c.symbolNative + ')';
                  })}
                  //options={getUniqueCurrencies().map((_c) => { return _c.currencyCode })}
                  getOptionLabel={(option) => option}
                  value={convertValuetoLabel(currency)}
                  renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                  }
                  onChange={(e, value) => handleChange(convertLabeltoValue(value))}
                  renderInput={(params) => (
                    <TextField {...params} margin="dense" variant="outlined" label="Currency in use" placeholder="Currency in use" />
                  )}
                  // renderOption={(option) => {
                  //   const { currencyCode, symbolNative, currencyName } = getUniqueCurrencies().find(d => d.currencyCode === option);
                  //   return `${currencyCode} - ${currencyName} - (${symbolNative})`
                  // }}
                />
              </Grid>
              <Grid xs={12} md={4} sm={4} container justify="flex-end">
                <FormControlLabel
                  control={<Checkbox name="required" checked={isApiUpdate} onChange={(e) => setIsApiUpdate(e.target.checked)} color="primary" />}
                  label="Auto Update Daily Through API"
                />
              </Grid>
            </Grid>
          </Box>
          <Box p={1}>
            {option && option.length > 0 && (
              <Fragment>
                <Grid container>
                  <Grid xs={12} container justify="flex-end">
                    <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" onClick={getcurrencyrates} size="small">
                      {' '}
                      Fetch Rates
                    </CustomButton>
                  </Grid>
                </Grid>
                <Box mt={1} border={1} p={1} borderColor="var(--common-border-color)" style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        {currency.map((_unit, index) => (
                          <th key={index} className={classes.tdWidth}>
                            {_unit}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currency.map((_unit, i) => (
                        <tr key={i}>
                          <th style={{ paddingRight: 10 }}>{_unit}</th>
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
              </Fragment>
            )}
          </Box>
        </div>
      </CustomContainer>
    </Fragment>
  );
};

export default CurrencyConverter;
