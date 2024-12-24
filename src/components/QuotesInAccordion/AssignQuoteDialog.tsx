import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  FormControl,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { CustomDialogTransition, quoteBuilder } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import SearchBox from '../Helpers/SearchBox';
import Loader from '../Loader';
const AssignQuoteDialog = ({ quoteDialogOpen, onSuccess, handleCloseDialog, assignedQuotes, accountId, contactId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [quotesConst, setQuotesConst] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoadingQuotes(true);
    axiosInstance()
      .get(`${quoteBuilder.qbApi}?filterById=[{"field":"customerAccountName", "term": "${accountId}"}]`)
      .then(({ data: { data } }) => {
        setQuotes(data.filter((quote) => !assignedQuotes.some((item) => item?._id === quote?._id)).map((obj) => ({ ...obj, isChecked: false })));
        setQuotesConst(data.filter((quote) => !assignedQuotes.some((item) => item?._id === quote?._id)).map((obj) => ({ ...obj, isChecked: false })));
        setLoadingQuotes(false);
      })
      .catch((error) => {
        setLoadingQuotes(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAssignQuotes = async () => {
    if (selectedQuotes.length) {
      setIsAssigning(true);

      const dataObj = {
        _ids: selectedQuotes,
        customerContact: [contactId]
      };

      await axiosInstance()
        .put(`/quote-builder/add-customer-contacts`, dataObj)
        .then(({ data }) => {
          setIsAssigning(false);
          toastConfig.setToastConfig({
            message: data.message,
            type: 'success',
            open: true
          });

          onSuccess();
        })
        .catch((error) => {
          setIsAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    let value = e.target.value.toLowerCase();
    setSearch(value);
    let result = [];
    result = quotesConst.filter((data) => {
      return data.quoteName.search(value) != -1;
    });
    setQuotes(result);
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="xs"
      open={quoteDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign Quotes" />
      <CustomDialogContent>
        {loadingQuotes ? (
          <Loader text="Loading Quotes" />
        ) : quotesConst.length ? (
          <>
            <Grid container>
              <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
                <FormControl component="fieldset">
                  <FormControlLabel
                    value="top"
                    control={
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          quotes.forEach((quote) => (quote.isChecked = e.target.checked));
                          setSelectedQuotes(quotes.filter((r) => r.isChecked).map((obj) => obj._id));
                        }}
                        checked={quotes.every((x) => x.isChecked)}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-select-all`
                        }}
                      />
                    }
                    label="Select All"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6} sm={6} container justify="flex-end">
                <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
              </Grid>
            </Grid>
            <List style={{ padding: 0 }}>
              {quotes.map((quote) => (
                <ListItem divider key={quote._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => {
                        quote.isChecked = e.target.checked;
                        setSelectedQuotes(quotes.filter((r) => r.isChecked).map((obj) => obj._id));
                      }}
                      checked={quote.isChecked}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${quote._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={quote.quoteName} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>All Quotes has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isAssigning} onClick={handleCloseDialog} color="primary" size="small">
          Cancel
        </Button>
        <Button disabled={!selectedQuotes.length || isAssigning} onClick={handleAssignQuotes} color="primary" size="small" variant="contained">
          {isAssigning ? <CircularProgress size={22} /> : 'Save'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignQuoteDialog;
