import { Container, CssBaseline } from '@material-ui/core';
import { cn } from 'src/constants/helpers';

type CustomContainerProps = {
  children: React.ReactNode;
  styles?: React.CSSProperties;
  maxWidth?: any | string;
  minHeight?: any;
  padding?: number | string;
} & React.HTMLAttributes<HTMLDivElement>;

const CustomContainer = (props: CustomContainerProps) => {
  const { children, styles, maxWidth, minHeight, padding, className, ...rest } = props;

  return (
    <>
      <CssBaseline />
      {!maxWidth ? (
        <div className={cn('main-container', className)} style={{ ...styles }} {...rest}>
          {children}
        </div>
      ) : (
        <Container
          className={cn('main-container', className)}
          maxWidth={maxWidth}
          {...rest}
          style={{
            minHeight: minHeight ? '100%' : 'calc(100vh - 65px)',
            padding: padding || '',
            ...styles
          }}
        >
          {children}
        </Container>
      )}
    </>
  );
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
