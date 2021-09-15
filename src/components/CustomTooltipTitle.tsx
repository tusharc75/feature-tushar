import { Tooltip, withStyles } from '@material-ui/core';

const HtmlTooltip = withStyles((theme) => ({
    tooltip: {
      backgroundColor: '#121212',
      color: '#ffffff',
      maxWidth: 300,
      fontSize: theme.typography.pxToRem(15),
      fontWeight: "normal"
    }
}))(Tooltip);
  
export default HtmlTooltip