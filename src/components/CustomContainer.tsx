import { Container, CssBaseline } from '@mui/material';
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
