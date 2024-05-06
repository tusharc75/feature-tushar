import { IconButton } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { AiOutlineHistory } from 'react-icons/ai';
import HtmlTooltip from '../CustomTooltipTitle';

export default function HistoryButton(props) {
  const { onClick } = props;
  return (
    <Box>
      <HtmlTooltip title="History">
        <IconButton className="mr-2" style={{ padding: '6px' }} onClick={onClick}>
          <AiOutlineHistory className="mr-1" size={20} />
        </IconButton>
      </HtmlTooltip>
    </Box>
  );
}
