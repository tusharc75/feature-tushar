import React from 'react';
import { withStyles } from '@material-ui/core';
import MuiDialogContent, { DialogContentProps } from '@material-ui/core/DialogContent';
import { useAppTheme } from 'src/constants/AppConfig';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { isMobile, isTablet } from 'react-device-detect';

const DialogContent = withStyles((theme) => ({
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
  const [themeColor] = useAppTheme();
  return (
    <React.Fragment>
      <DialogContent
        // className={`${
        //   isFooterPresent
        //     ? 'max-h-[calc(var(--vh)-110px)] max-[560px]:max-h-[calc(var(--vh)-99px)]'
        //     : 'max-h-[calc(var(--vh)-55px)] max-[560px]:max-h-[calc(var(--vh)-45px)]'
        // } overscroll-contain ${isTablet || isMobile ? 'min-h-[250px]' : ''} truncate-autocomplete`}

        className={`${
          isFooterPresent ? ' max-[560px]:max-h-[calc(var(--vh)-99px)]' : ' max-[560px]:max-h-[calc(var(--vh)-45px)]'
        } overscroll-contain ${isTablet || isMobile ? 'min-h-[250px]' : ''} truncate-autocomplete`}
        style={
          {
            ...style,
            background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff',
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
