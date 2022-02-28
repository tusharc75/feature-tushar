import { Typography, Box } from '@material-ui/core';
import { Info } from '@material-ui/icons';

import Tooltip from 'src/components/CustomTooltipTitle';
import { formatAmountWithCurrency } from 'src/constants/helpers';

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
            <Typography>
              Total Offered Value: {data?.totalOfferedValue ? formatAmountWithCurrency(currency, data?.totalOfferedValue).fullFormatAmount : 0}
            </Typography>
            <Typography>Hit Ratio: {data?.hitRatioValue?.toFixed(2)}</Typography>
          </>
        );

      case 'Total Booked Cost':
        return (
          <>
            <Typography>
              Total Offered Cost: {data?.totalOfferedCost ? formatAmountWithCurrency(currency, data?.totalOfferedCost).fullFormatAmount : 0}
            </Typography>
            <Typography>Hit Ratio: {data?.hitRatioCost?.toFixed(2)}</Typography>
          </>
        );

      case 'Booked Gross Margin':
        return (
          <>
            <Typography>
              {`Offered Gross Margin:  ${data?.offeredMargin ? formatAmountWithCurrency(currency, data?.offeredMargin).fullFormatAmount : 0} (${
                data?.offeredMarginPercent || 0
              }%)`}
            </Typography>
            <Typography>Hit Ratio: {data?.hitRatioMargin?.toFixed(2)}</Typography>
          </>
        );

      case 'Total Booked Volume':
        return (
          <>
            <Typography>{`Total Offered Volume: ${data?.offeredMargin?.toFixed(2)} ${data?.volumeUnit}`}</Typography>
            <Typography>Hit Ratio: {data?.hitRatioVolume?.toFixed(2)}</Typography>
          </>
        );

      default:
        break;
    }
  };

  return (
    <Tooltip interactive arrow title={getValue()}>
      <Box display={'flex'} alignItems="center" ml={1}>
        <Info color="action" fontSize="small" />
      </Box>
    </Tooltip>
  );
};

export default EyeTooltip;
