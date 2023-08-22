import React from "react";
import { Button, CircularProgress } from "@material-ui/core";
import "../sidebar.scss";
import { isMobile } from "react-device-detect";
import { MdRateReview } from "react-icons/md";

function CustomButton(props) {
  const { loading, children, disabled, size=null, ...rest } = props;
  return (
    <Button {...rest} disabled={disabled} size={size || "small"} variant={"contained"} endIcon={loading &&
      <CircularProgress
        size={18}
        color="inherit"
      />}>
      {/*style={isMobile ? {color:"var(--danger-light)"} : {}} {isMobile ? <MdRateReview size={20}/> : children} */}
      {children}
    </Button>
  );
}
export default CustomButton;
