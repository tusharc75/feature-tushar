import React, { FC, ReactNode } from 'react';
import { PressureIcon, TemperatureIcon, VolumeIcon } from 'src/assets/svg/svgIcons';
import { Typography } from '@mui/material';
import styles from './index.module.scss';

interface MetricsWithIconProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'temperature' | 'pressure' | 'volume';
  value: number | string;
  prefixText?: ReactNode | string;
  suffixText?: ReactNode | string;
  icon?: ReactNode;
  lebel?: string | ReactNode;
}

const iconMap = (type: MetricsWithIconProps['type']) => {
  let Icon = PressureIcon;
  let text = 'Pressure';
  switch (type) {
    case 'temperature':
      Icon = TemperatureIcon;
      text = 'Temp';
      break;
    case 'pressure':
      Icon = PressureIcon;
      text = 'Pressure';
      break;
    case 'volume':
      Icon = VolumeIcon;
      text = 'Volume';
      break;
    default:
      break;
  }
  return [Icon, text];
};

const MetricsWithIcon: FC<MetricsWithIconProps> = ({ type, value, prefixText, suffixText, icon, lebel, ...rest }) => {
  const [Icon, text] = iconMap(type);
  return (
    <div className={`${styles.metricsWithIcon} ${rest.className} ${styles[type]}`} {...rest}>
      <div className={styles.iconContainer}>{icon ? icon : <Icon />}</div>
      <Typography component={'h6'}>{lebel ? lebel : text}</Typography>
      <Typography>
        {prefixText && <Typography component={'span'}>{prefixText}&nbsp;</Typography>}
        {value}
        {suffixText && <Typography component={'span'}>&nbsp;{suffixText}</Typography>}
      </Typography>
    </div>
  );
};

export default MetricsWithIcon;
