import { useState, useRef, useEffect } from 'react';
import { Dialog, IconButton, TextField, InputAdornment, Box, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, formatAmountWithCurrency } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ItemizeMileage = ({ onClose, setLineItems, lineItems, currency, currencySymbol, isSubmitting, totalAmount }) => {
  const [touchedFields, setTouchedFields] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const fromAutocompleteServiceRef = useRef(null);
  const toAutocompleteServiceRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      if (!fromAutocompleteServiceRef.current) {
        fromAutocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      if (!toAutocompleteServiceRef.current) {
        toAutocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
    }
  }, []);

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleFromInputChange = (event, value, reason) => {
    if (reason === 'input') {
      if (value?.length > 1 && fromAutocompleteServiceRef.current) {
        fromAutocompleteServiceRef.current.getPlacePredictions({ input: value }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setFromSuggestions(predictions);
          } else {
            setFromSuggestions([]);
          }
        });
      } else {
        setFromSuggestions([]);
      }
    }
  };

  const handleToInputChange = (event, value, reason) => {
    if (reason === 'input') {
      if (value?.length > 2 && toAutocompleteServiceRef.current) {
        toAutocompleteServiceRef.current.getPlacePredictions({ input: value }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setToSuggestions(predictions);
          } else {
            setToSuggestions([]);
          }
        });
      } else {
        setToSuggestions([]);
      }
    }
  };

  const handleSelectLocation = (index, prediction, isFrom) => {
    if (!prediction?.place_id || !window.google) return;
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
  
    placesService.getDetails({ placeId: prediction.place_id }, (placeResult) => {
      if (placeResult && placeResult.geometry) {
        const lat = placeResult.geometry.location.lat();
        const lng = placeResult.geometry.location.lng();
  
        const newFields = [...lineItems];
        const newLocation = {
          lat,
          lng,
          description: prediction.description
        };
  
        if (isFrom) {
          newFields[index].fromLocation = newLocation;
        } else {
          newFields[index].toLocation = newLocation;
        }
  
        if (newFields[index].fromLocation && newFields[index].toLocation) {
          const { lat: lat1, lng: lon1 } = newFields[index].fromLocation;
          const { lat: lat2, lng: lon2 } = newFields[index].toLocation;
  
          const distance = haversineDistance(lat1, lon1, lat2, lon2);
          newFields[index].distance = distance.toFixed(2);
  
          if (newFields[index].rate) {
            newFields[index].amount = (distance * newFields[index].rate).toFixed(2);
          }
        }
  
        setLineItems(newFields);
      }
    });
  };
  

  const handleBlur = (index, field) => {
    setTouchedFields((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: true }
    }));
  };

  const isFormValid = () => {
    return lineItems.every((item) => item.fromLocation && item.toLocation && item.rate > 0);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: lineItems.length, fromLocation: null, toLocation: null, rate: '', distance: '', amount: '' }]);
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleInputChange = (index, field, event) => {
    const newFields = [...lineItems];
    newFields[index][field] = event.target.value;
  
    if (field === "rate" && newFields[index].distance) {
      newFields[index].amount = (newFields[index].distance * newFields[index].rate).toFixed(2);
    }
  
    setLineItems(newFields);
  };
  

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      open={true}
    >
      <CustomDialogHeader
        title="Mileage"
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => setFullScreen((prevState) => !prevState)}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <div>
          <Box pb={2}>
            <ThemeButton startIcon={<AddIcon fontSize="small" />} onClick={addLineItem}>
              Add
            </ThemeButton>
          </Box>
          {lineItems.map((item, index) => (
            <Grid container spacing={2} key={item.id} alignItems="center" sx={{ marginBottom: 2 }}>
              <Grid size={{ xs: 6 }}>
                <Autocomplete
                  options={fromSuggestions}
                  filterOptions={(x) => x}
                  getOptionLabel={(option) => option?.description || ''}
                  value={item.fromLocation ? { description: item.fromLocation.description } : null}
                  onInputChange={handleFromInputChange}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleSelectLocation(index, newValue, true);
                    } else {
                      const newFields = [...lineItems];
                      newFields[index].fromLocation = null;
                      setLineItems(newFields);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From Location"
                      size="small"
                      onBlur={() => handleBlur(index, 'fromLocation')}
                      error={touchedFields[index]?.fromLocation && !item.fromLocation}
                      helperText={touchedFields[index]?.fromLocation && !item.fromLocation ? 'Location is required' : ''}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Autocomplete
                  options={toSuggestions}
                  filterOptions={(x) => x}
                  getOptionLabel={(option) => option?.description || ''}
                  value={item.toLocation ? { description: item.toLocation.description } : null}
                  onInputChange={handleToInputChange}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleSelectLocation(index, newValue, false);
                    } else {
                      const newFields = [...lineItems];
                      newFields[index].toLocation = null;
                      setLineItems(newFields);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To Location"
                      size="small"
                      onBlur={() => handleBlur(index, 'toLocation')}
                      error={touchedFields[index]?.toLocation && !item.toLocation}
                      helperText={touchedFields[index]?.toLocation && !item.toLocation ? 'Location is required' : ''}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Distance in KMs"
                  type="number"
                  size="small"
                  disabled
                  value={item.distance}
                  onChange={(event) => {
                    const newValue = Number(event.target.value);
                    if (newValue >= 0 || event.target.value === '') {
                      handleInputChange(index,'distance', event);
                    }
                  }}
                  onBlur={() => handleBlur(index, 'distance')}
                  fullWidth
                  required
                  error={touchedFields[index]?.distance && item.distance <= 0}
                  helperText={touchedFields[index]?.distance && item.distance <= 0 ? 'Distance is required' : ''}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Rate"
                  type="number"
                  size="small"
                  value={item.rate}
                  onChange={(event) => {
                    const newValue = Number(event.target.value);
                    if (newValue >= 0 || event.target.value === '') {
                      handleInputChange(index,'rate', event);
                    }
                  }}
                  onBlur={() => handleBlur(index, 'rate')}
                  fullWidth
                  required
                  error={touchedFields[index]?.rate && item.rate <= 0}
                  helperText={touchedFields[index]?.rate && item.rate <= 0 ? 'Rate is required' : ''}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Amount"
                  type="number"
                  size="small"
                  disabled
                  value={item.amount}
                  onChange={(event) => {
                    const newValue = Number(event.target.value);
                    if (newValue >= 0 || event.target.value === '') {
                      handleInputChange(index, 'amount', event);
                    }
                  }}
                  onBlur={() => handleBlur(index, 'amount')}
                  fullWidth
                  required
                  error={touchedFields[index]?.amount && item.amount <= 0}
                  helperText={touchedFields[index]?.amount && item.amount <= 0 ? 'Amount is required' : ''}
                />
              </Grid>
              <Grid size={{ xs: 2 }}>
                <HtmlTooltip title="Remove">
                  <IconButton onClick={() => removeLineItem(item.id)} aria-label="delete">
                    <DeleteIcon color="error" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </Grid>
            </Grid>
          ))}
          <div className="grid justify-end pt-3">
            <span className="font-medium">Total Amount: {formatAmountWithCurrency(currency, totalAmount)?.fullFormatAmountWithoutSpace}</span>
          </div>
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" id="dialog-cancel-button" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton isLoading={isSubmitting} buttonType="theme" id="dialog-save-button" disabled={!isFormValid() || isSubmitting} onClick={onClose}>
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ItemizeMileage;
