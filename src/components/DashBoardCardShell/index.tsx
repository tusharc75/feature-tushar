import React from 'react';
import styles from './dashBoardCardShell.module.scss';
import { useAppTheme } from 'src/constants/AppConfig';

interface CardInterface extends React.HTMLAttributes<HTMLDivElement> {
  background?: string;
  gradientColors?: string[];
  minHeight?: boolean;
  darkThemeBackgroundColor?: string;
}

const DashBoardCardShell: React.FC<CardInterface> = ({
  className,
  children,
  background = '#fff',
  gradientColors = ['#577BFC', '#1608BD'],
  style,
  minHeight = true,
  darkThemeBackgroundColor = 'var(--dark-primary)',
  ...props
}) => {
  const [theme] = useAppTheme();
  const styleConfig = {
    '--bg_color': theme === 'dark' ? darkThemeBackgroundColor : background,
    textAlign: 'left',
    '--bg-gradient-colors': `to bottom, ${gradientColors.join(', ')}`,
    '--min-height': minHeight ? '219px' : 'auto'
  } as React.CSSProperties;
  return (
    <div {...props} style={{ ...styleConfig, ...style }} className={`${className} border bg-[--dark-secondary,#fcffff] ${styles.singlecardShell}`}>
      {children}
    </div>
  );
};

export default DashBoardCardShell;
