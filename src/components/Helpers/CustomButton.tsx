import React from "react";
import { Button, CircularProgress } from "@material-ui/core";
import "../sidebar.scss";
import {isMobile} from "react-device-detect";
import {MdRateReview} from "react-icons/all";
function CustomButton(props) {
  const { loading, children, disabled, ...rest } = props;
  return (
    <Button {...rest} disabled={disabled} size="small" variant={isMobile ? "text" : "contained"} style={isMobile ? {color:"var(--danger-light)"} : {}}>
      {loading ? (
        <CircularProgress
          style={{ marginRight: "8px" }}
          size={20}
          color="inherit"
        />
      ) : null}
      {isMobile ? <MdRateReview size={20}/> : {children}}
    </Button>
  );
}
export default CustomButton;
