import { Button } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import { FC, useEffect, useMemo, useState } from 'react';
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
  message = 'Mobile device not supported',
  description = `Kindly open this page in Laptop/Desktop browser.`
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

  const prvPathname = useMemo(() => {
    const pathname = history.location.pathname;
    const pathArray = pathname.split('/');
    let prevPathArray = [];
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (key === 'detail') continue;
      prevPathArray.push(key);
    }
    return prevPathArray.join('/');
  }, [history.location.pathname]);

  return isVisible ? (
    <div className="fixed inset-0 bg-[var(--new-theme-color)] text-[white] z-[999999]">
      <div className=" grid place-items-center h-full">
        <div className="text-center px-2">
          <h1 className="text-[20px] font-bold mb-2">{message}</h1>
          <p className="text-[14px] mb-3">{description}</p>
          <Button
            startIcon={<ArrowBack className="mr-2" />}
            onClick={() => {
              history.replace(prvPathname);
            }}
            variant="contained"
            className="no-shadow"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  ) : null;
};

export default DeviceMessage;
