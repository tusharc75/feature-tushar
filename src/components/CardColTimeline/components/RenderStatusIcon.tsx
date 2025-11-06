import { Box } from '@mui/material';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { WORKORDER_SERVICE_STEP_STATUS } from 'src/constants/helpers';

const RenderStatusIcon = ({ stepStatus }: { stepStatus: string }) => {
  return (
    <>
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.passed && (
        <HtmlTooltip title={stepStatus} placement="top" arrow enterTouchDelay={0}>
          <Box style={{ color: '#4BAE4F', fontSize: '25px', width: 25 }}>
            <AiFillCheckCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.failed && (
        <HtmlTooltip title={stepStatus} placement="top" arrow enterTouchDelay={0}>
          <Box style={{ color: '#F25F54', fontSize: '25px', width: 25 }}>
            <AiFillExclamationCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
    </>
  );
};

export default RenderStatusIcon;
