import { useState, useEffect, useContext, useMemo, Fragment } from "react";
import Box from "@material-ui/core/Box/Box";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { dateFormat, formatAmountWithCurrency, rentalManagement, sidebarResource, treeToFlatArray, generateUniqueId } from "../../../constants/helpers";
import moment from "moment";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import ManagePurchaseOrder from "../../PurchaseOrder/ManagePurchaseOrder";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";

const Invoice = ({ rentalManagementData, isTabletScreen, isSmallScreen, setNextStep, showActivity, currencySymbol }) => {

  const toastConfig = useContext(CustomToastContext);


  return (<Fragment>

  </Fragment>
  );
}
export default Invoice;