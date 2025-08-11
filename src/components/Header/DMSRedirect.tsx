import { IconButton } from '@mui/material';
import { FiExternalLink } from 'react-icons/fi';
import { PiDatabaseBold } from 'react-icons/pi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { VITE_APP_DMS_URL, VITE_APP_ENV } from 'src/config';
import { useData } from 'src/StateProvider/Provider';

const DMSRedirect = () => {

  const { state: { user } }: any = useData();

  const handleRedirect = () => {
    const token = localStorage.getItem('token');
    let redirectUrl = VITE_APP_DMS_URL;
    if (token) {
      redirectUrl = `${VITE_APP_DMS_URL}/oauth?token=${encodeURIComponent(token)}`;
    }
    window.open(redirectUrl, '_blank');
  };

  return (VITE_APP_DMS_URL && ((user?.user?.brand === '66c81f4780d6ec9b112302ef' && VITE_APP_ENV === 'production') || VITE_APP_ENV !== 'production') ?
    <HtmlTooltip title={`Open EDrive`} className="inline-block">
      <span className="relative mx-2 inline-block rounded-full border border-blue-400 bg-blue-500/10 dark:border-blue-800">
        <IconButton sx={{ padding: '5px', width: '30px', height: '30px' }} onClick={handleRedirect}>
          <FiExternalLink className="absolute -right-[5px] -top-[5px] text-[#0000FF] dark:text-blue-600" size={14} />
          <PiDatabaseBold size={18} className="text-[#2563EB]" />
        </IconButton>
      </span>
    </HtmlTooltip> : null
  );
};

export default DMSRedirect;
