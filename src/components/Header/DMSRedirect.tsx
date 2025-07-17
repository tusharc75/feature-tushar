import { IconButton } from '@mui/material';
import { FiExternalLink } from 'react-icons/fi';
import { PiDatabaseBold } from 'react-icons/pi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const DMSRedirect = () => {
  const envLink = import.meta.env.VITE_APP_DMS_URL;
  if (!envLink) return null;

  return (
    <HtmlTooltip
      title={
        <>
          <p>Open DMS App</p>
          <span className="text-[12px]">(External APP)</span>
        </>
      }
      className="inline-block"
    >
      <span className="relative mx-2 inline-block rounded-full border border-blue-400 bg-blue-500/10">
        <IconButton sx={{ padding: '5px', width: '30px', height: '30px' }} onClick={() => window.open(envLink, '_blank')}>
          <FiExternalLink className="absolute -right-[5px] -top-[5px] text-[#0000FF]" size={14} />
          <PiDatabaseBold size={18} className="text-[#2563EB]" />
        </IconButton>
      </span>
    </HtmlTooltip>
  );
};

export default DMSRedirect;
