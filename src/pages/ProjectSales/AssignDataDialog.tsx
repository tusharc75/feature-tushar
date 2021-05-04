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
import { startCase, camelCase, kebabCase, lowerCase } from "lodash";

import Loader from "../../components/Loader";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const AssignDataDialog = ({
  dialogOpen,
  onSuccess,
  handleCloseDialog,
  type,
  projectID,
  existingData,
  accountId = "",
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    const url =
      type === "customer-contact"
        ? `/${type}?filterById=[{"field":"accountName", "term": ${accountId}}]`
        : `/${type}?limit=100`;
    setLoading(true);
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        const filteredData = data.filter(
          (_d) => !existingData().some((item) => item === _d?._id)
        );

        setData(filteredData);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleUserSelection = (e, id) => {
    let tempSelectedData = [...selectedData];
    let curIndex = tempSelectedData.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedData = [...tempSelectedData, id];
    } else if (curIndex >= 0) {
      tempSelectedData.splice(curIndex, 1);
    }
    setSelectedData(tempSelectedData);
  };

  const handleSave = async () => {
    if (selectedData.length) {
      setAssigning(true);

      const dataObj = {
        [camelCase(type)]: [...selectedData, ...existingData()],
        _id: projectID,
      };

      await axiosInstance()
        .put(`/project-sales/add-${kebabCase(type)}`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: `${startCase(type)} added successfully`,
            type: "success",
            open: true,
          });

          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const getHeading = (type: string, data: any) => {
    switch (type) {
      case "user":
        return `${data.firstName}  ${data.lastName}`;
      case "lead":
        return `${data.salutation} ${data.firstName} ${data.middleName}  ${data.lastName}`;
      case "opportunity":
        return `${data.opportunityName}`;
      case "customer-account":
        return `${data.accountName}`;
      case "customer-contact":
        return `${data.salutation} ${data.firstName} ${data.middleName}  ${data.lastName}`;
      default:
        break;
    }
  };

  const getSubHeading = (type: string, data: any) => {
    switch (type) {
      case "user":
        return data.email;
      case "lead":
        return "";
      case "opportunity":
        return "";
      case "customer-account":
        return "";
      case "customer-contact":
        return "";
      default:
        return "";
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={dialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-dialog"
    >
      <CustomDialogHeader title={`Assign ${startCase(type)}`} />
      <CustomDialogContent>
        {loading ? (
          <Loader text={`Loading ${startCase(type)}`} />
        ) : data.length ? (
          <List style={{ padding: 0 }}>
            {data.map((_d) => (
              <ListItem divider key={_d._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => handleUserSelection(e, _d._id)}
                    checked={selectedData.indexOf(_d._id) >= 0}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${_d._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={getHeading(type, _d)}
                  secondary={getSubHeading(type, _d)}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>
            There are no {lowerCase(type)}s or you have already added all{" "}
            {lowerCase(type)}s
          </Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          disabled={!selectedData.length || isAssigning}
          onClick={handleSave}
          color="primary"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignDataDialog;
