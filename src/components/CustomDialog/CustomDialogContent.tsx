import React from 'react';
import { DialogContent as MuiDialogContent, DialogContentProps, Theme } from '@mui/material';
import { useAppTheme } from 'src/constants/AppConfig';
import { isMobile, isTablet } from 'react-device-detect';
import { withStyles, CSSProperties } from '@mui/styles';
import { cn } from 'src/constants/helpers';

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1, 2)
  }
}))(MuiDialogContent);

const useViewportDynamicHeight = () => {
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const setHeightFunc = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        setHeight(vh);
        document.body.style.setProperty('--vh', `${vh}px`);
        document.body.style.overflow = 'hidden';
      }
    };
    setHeightFunc();
    window?.visualViewport?.addEventListener('resize', setHeightFunc);
    return () => {
      document.body.style.removeProperty('--vh');
      document?.body?.removeAttribute?.('style');
      window?.visualViewport?.removeEventListener('resize', setHeightFunc);
    };
  }, []);
  return height;
};

type DialogContentPropsExtended = DialogContentProps & {
  isFooterPresent?: boolean;
};

function CustomDialogContent({ children, style = {}, isFooterPresent = true, ...others }: DialogContentPropsExtended) {
  const vh = useViewportDynamicHeight();
  return (
    <React.Fragment>
      <DialogContent
        className={cn(
          'truncate-autocomplete overscroll-contain bg-[--dark-primary,white] px-6 py-5',
          isFooterPresent ? ' max-[560px]:max-h-[calc(var(--vh)-99px)]' : ' max-[560px]:max-h-[calc(var(--vh)-45px)]',
          isTablet || isMobile ? 'min-h-[250px]' : ''
        )}
        style={
          {
            ...style,
            '--vh': `${vh}px`
          } as CSSProperties
        }
        {...others}
      >
        {children}
      </DialogContent>
    </React.Fragment>
  );
}

export default CustomDialogContent;
