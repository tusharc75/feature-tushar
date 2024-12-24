import { Theme, Tooltip, TooltipProps } from '@mui/material';
import { cn } from 'src/constants/helpers';
import { withStyles } from '@mui/styles';

const TooltipWithStyle = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: '#121212',
    color: '#ffffff',
    maxWidth: 300,
    fontSize: theme.typography.pxToRem(15),
    fontWeight: 'normal'
  }
}))(Tooltip);

const HtmlTooltip = ({ children, className, onClick, style = {}, ...props }: TooltipProps) => {
  return (
    <TooltipWithStyle {...props} enterTouchDelay={0} placement="top" arrow>
      <span style={style} onClick={onClick} className={cn('html-custom-tooltip', className)}>
        {children}
      </span>
    </TooltipWithStyle>
  );
};

export default HtmlTooltip;
