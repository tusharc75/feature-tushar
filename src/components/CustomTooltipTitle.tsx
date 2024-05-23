import { Tooltip, withStyles, TooltipProps } from '@material-ui/core';

const TooltipWithStyle = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#121212',
    color: '#ffffff',
    maxWidth: 300,
    fontSize: theme.typography.pxToRem(15),
    fontWeight: 'normal'
  }
}))(Tooltip);

const HtmlTooltip = ({ children, ...props }: TooltipProps) => {
  return (
    <TooltipWithStyle {...props} enterTouchDelay={0} placement="top" arrow>
      <span className="tooltip-asdfkljashdfkjas">{children}</span>
    </TooltipWithStyle>
  );
};

export default HtmlTooltip;
