import { Button } from '@material-ui/core';
import { FC, useEffect, useState } from 'react';
import { isDesktop, isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';

interface DeviceMessageProps {
  devices?: TDevices[];
  message?: string;
  description?: string;
}

type TDevices = 'mobile' | 'tablet' | 'desktop';

const DeviceMessage: FC<DeviceMessageProps> = ({
  devices = ['mobile'],
  message = 'Kindly view this page on web version.',
  description = `We don't support mobile devices yet. Please visit this page with a desktop browser for the best experience`
}) => {
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    let visible = false;
    switch (true) {
      case devices.includes('mobile') && isMobile && !isTablet:
        visible = true;
        break;
      case devices.includes('tablet') && isTablet:
        visible = true;
        break;
      case devices.includes('desktop') && isDesktop:
        visible = true;
        break;
      default:
        break;
    }
    setIsVisible(visible);
  }, [devices]);

  return isVisible ? (
    <div className="fixed inset-0 bg-[var(--new-theme-color)] text-[white] z-[999999]">
      <div className=" grid place-items-center h-full">
        <div className="text-center px-2">
          <h1 className="text-[20px] font-bold mb-2">{message}</h1>
          <p className="text-[14px] mb-3">{description}</p>
          <Button onClick={() => history.goBack()} variant="contained" className="no-shadow" style={{ background: 'var(--primary)', color: 'white' }}>
            Back
          </Button>
        </div>
      </div>
    </div>
  ) : null;
};

export default DeviceMessage;
