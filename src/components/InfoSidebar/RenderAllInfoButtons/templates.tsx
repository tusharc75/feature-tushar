import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { IconButton, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import Zoom from '@mui/material/Zoom';
import { styled } from '@mui/styles';

const TooltipWithStyle = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }: any) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#121212',
      color: '#ffffff',
      maxWidth: 300,
      fontSize: '15px',
      fontWeight: 'normal'
    }
  })
);

export const RenderInfoButton = ({
  onClick,
  tooltip = 'Information'
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  tooltip?: string;
}) => {
  return (
    <TooltipWithStyle
      title={tooltip}
      enterTouchDelay={0}
      placement={'top'}
      arrow
      slots={{
        transition: Zoom
      }}
    >
      <IconButton
        sx={{ borderRadius: '99px', color: 'var(--primary-text)', width: '30px', height: '30px' }}
        size={'small'}
        onClick={onClick}
        color="primary"
      >
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
    </TooltipWithStyle>
  );
};
