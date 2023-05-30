import React from 'react';
import styles from './dashBoardCardShell.module.scss';

interface CardInterface extends React.HTMLAttributes<HTMLDivElement> {
  background?: string;
  gradientColors?: string[];
  minHeight?: boolean;
}

const DashBoardCardShell: React.FC<CardInterface> = ({
  className,
  children,
  background = '#fff',
  gradientColors = ['#577BFC', '#1608BD'],
  style,
  minHeight = true,
  ...props
}) => {
  const styleConfig = {
    '--bg_color': background,
    textAlign: 'left',
    '--bg-gradient-colors': `to bottom, ${gradientColors.join(', ')}`,
    '--min-height': minHeight ? '219px' : 'auto'
  } as React.CSSProperties;
  return (
    <div {...props} style={{ ...styleConfig, ...style }} className={`${className} ${styles.singlecardShell}`}>
      {children}
    </div>
  );
};

export default DashBoardCardShell;
