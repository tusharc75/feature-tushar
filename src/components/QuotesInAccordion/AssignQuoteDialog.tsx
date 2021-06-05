import { useState, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import Loader from "../Loader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { opportunity, quoteBuilder } from "../../constants/helpers"
const AssignQuoteDialog = ({
  quoteDialogOpen,
  onSuccess,
  handleCloseDialog,
  assignedQuotes,
  accountId,
  contactId
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    setLoadingQuotes(true);
    axiosInstance()
      .get(`${quoteBuilder.qbApi}?filterById=[{"field":"customerAccountName", "term": "${accountId}"}]`)
      .then(({ data: { data } }) => {
        setQuotes(data.filter(quote => !assignedQuotes.some(item => item?._id === quote?._id)).map(obj => ({ ...obj, isChecked: false })))
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
        "_ids": selectedQuotes,
        "customerContact": [contactId]
      };

      await axiosInstance()
        .put(`/quote-builder/add-customer-contacts`, dataObj)
        .then(({ data }) => {
          setIsAssigning(false);
          toastConfig.setToastConfig({
            message: data.message,
            type: "success",
            open: true,
          });

          onSuccess();
        })
        .catch((error) => {
          setIsAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
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
        ) : quotes.length ? (
          <List style={{ padding: 0 }}>
            {quotes.map((quote) => (
              <ListItem divider key={quote._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      quote.isChecked = e.target.checked
                      setSelectedQuotes(quotes.filter(r => r.isChecked).map(obj => obj._id))
                    }
                    }
                    checked={quote.isChecked}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${quote._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={quote.quoteName}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>All Quotes has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
          size="small"
        >
          Cancel
        </Button>
        <Button
          disabled={!selectedQuotes.length || isAssigning}
          onClick={handleAssignQuotes}
          color="primary"
          size="small"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignQuoteDialog;
