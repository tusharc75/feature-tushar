import { Typography, Box } from '@material-ui/core';

import { formatAmountWithCurrency } from 'src/constants/helpers';
import styles from '../KpiDashboard/dashboard.module.scss';

interface Props {
  title: string;
  currency: string;
  data: any;
}

const EyeTooltip = (props: Props) => {
  const { currency, data, title } = props;

  const getValue = () => {
    switch (title) {
      case 'Total Booked Value':
        return (
          <>
            <Typography className={styles.sub_price}>
              {data?.totalOfferedValue ? formatAmountWithCurrency(currency, data?.totalOfferedValue).fullFormatAmount : 0}
            </Typography>
            <Typography variant="h6" className={styles.title}>
              Total Offered Value
            </Typography>
            <p className={styles.hit_ratio}>Hit Ratio: {data?.hitRatioValue ? (data.hitRatioValue / 100).toFixed(2) : 0} %</p>
          </>
        );

      case 'Total Booked Cost':
        return (
          <>
            <Typography className={styles.sub_price}>
              {data?.totalOfferedCost ? formatAmountWithCurrency(currency, data?.totalOfferedCost).fullFormatAmount : 0}
            </Typography>
            <Typography variant="h6" className={styles.title}>
              Total Offered Cost
            </Typography>
            <p className={styles.hit_ratio}>Hit Ratio: {data?.hitRatioCost ? (data?.hitRatioCost / 100).toFixed(2) : 0} % </p>
          </>
        );

      case 'Booked Gross Margin':
        return (
          <>
            <Typography className={styles.sub_price}>
              {data?.offeredMargin ? formatAmountWithCurrency(currency, data?.offeredMargin).fullFormatAmount : 0}
            </Typography>
            <Typography variant="h6" className={styles.title}>
              Offered Gross Margin
            </Typography>

            <p className={styles.hit_ratio}>Hit Ratio: {data?.hitRatioMargin ? (data?.hitRatioMargin / 100).toFixed(2) : 0} %</p>
          </>
        );

      case 'Total Booked Volume':
        return (
          <>
            <Typography className={styles.sub_price}>
              {data?.offeredMargin?.toFixed(2)} {data?.volumeUnit}
            </Typography>
            <Typography variant="h6" className={styles.title}>
              Total Offered Volume
            </Typography>{' '}
            <p className={styles.hit_ratio}>Hit Ratio: {data?.hitRatioVolume ? (data?.hitRatioVolume / 100).toFixed(2) : 0}%</p>
          </>
        );

      default:
        break;
    }
  };

  return <Box mt={'4px'}>{getValue()}</Box>;
};

export default EyeTooltip;
