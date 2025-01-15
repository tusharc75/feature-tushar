import { Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import { cn } from 'src/constants/helpers';
import { styled } from '@mui/styles';
import Zoom from '@mui/material/Zoom';

const TooltipWithStyle = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }: any) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#121212',
      color: '#ffffff',
      maxWidth: 300,
      fontSize: theme.typography.pxToRem(15),
      fontWeight: 'normal'
    }
  })
);

const HtmlTooltip = ({ children, className, onClick, style = {}, title, ...props }: TooltipProps) => {
  return (
    <TooltipWithStyle
      title={title}
      enterTouchDelay={0}
      placement="top"
      arrow
      slots={{
        transition: Zoom
      }}
    >
      <span style={style} onClick={onClick} className={cn('html-custom-tooltip', className)}>
        {children}
      </span>
    </TooltipWithStyle>
  );
};

export default HtmlTooltip;
