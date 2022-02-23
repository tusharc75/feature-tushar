import { Typography, Box } from '@material-ui/core';
import { Visibility } from '@material-ui/icons';

import Tooltip from 'src/components/CustomTooltipTitle';
import { formatAmountWithCurrency } from 'src/constants/helpers';

interface Props {
  title: string;
  currency: string;
  data: any;
}

const EyeTooltip = (props: Props) => {
  const { currency, data, title } = props;
  return (
    <Tooltip
      interactive
      arrow
      title={
        <Typography>
          {title}: {formatAmountWithCurrency(currency, data).fullFormatAmount}
        </Typography>
      }
    >
      <Box display={'flex'} alignItems="center" ml={1}>
        <Visibility color="action" fontSize="small" />
      </Box>
    </Tooltip>
  );
};

export default EyeTooltip;
