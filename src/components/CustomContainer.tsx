import PropTypes from "prop-types";
import { Container, CssBaseline } from "@material-ui/core";

const CustomContainer = (props) => {
  const { children, styles, maxWidth, minHeight, padding } = props;

  return (
    <>
      <CssBaseline />
      {!maxWidth ? (
        <div className="main-container" style={{ ...styles }}>
          {children}
        </div>
      ) : (
        <Container className="main-container"
          maxWidth={maxWidth}
          style={{
            minHeight: minHeight ? "100%" : "calc(100vh - 65px)",
            padding: padding || "",
            ...styles,
          }}
        >
          {children}
        </Container>
      )}
    </>
  );
};

CustomContainer.propTypes = {
  children: PropTypes.node.isRequired,
  styles: PropTypes.object,
  maxWidth: PropTypes.string,
  minHeight: PropTypes.any,
  padding: PropTypes.any,
};

export default CustomContainer;

// import React from "react";
// import { makeStyles } from "@material-ui/core/styles";
// import { Paper } from "@material-ui/core";

// const useStyles = makeStyles((theme) => ({
//   root: {
//     padding: theme.spacing(2),
//     marginTop: theme.spacing(2),
//     minHeight: "calc(100vh - 65px)",
//   },
// }));

// const CustomContainer = (props) => {
//   const { children, style } = props;
//   const classes = useStyles();

//   return (
//     <Paper elevation={0} className={classes.root} style={{ ...style }}>
//       {children}
//     </Paper>
//   );
// };

// export default CustomContainer;
