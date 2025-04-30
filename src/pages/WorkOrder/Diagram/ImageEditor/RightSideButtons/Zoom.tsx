import { ZoomIn, ZoomOut } from '@mui/icons-material';
import React, { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { RightSideButtonsProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons';

const Zoom = ({ imageEditor }: RightSideButtonsProps) => {
  const [zoomLevel, setZoomLevel] = useState(0);

  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const newZoomLevel = prev + 1 > 5 ? 5 : prev + 1;
      return newZoomLevel;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoomLevel = prev - 1 < 0 ? 0 : prev - 1;
      return newZoomLevel;
    });
  };

  return (
    <>
      <li>
        <HtmlTooltip title={'Zoom in'} placement="right">
          <RippleButton
            onClick={handleZoomIn}
            className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md hover:bg-theme/20 disabled:text-gray-500')}
          >
            <ZoomIn />
          </RippleButton>
        </HtmlTooltip>
      </li>
      <li>
        <HtmlTooltip title={'Zoom out'} placement="right">
          <RippleButton
            onClick={handleZoomOut}
            className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md hover:bg-theme/20 disabled:text-gray-500')}
          >
            <ZoomOut />
          </RippleButton>
        </HtmlTooltip>
      </li>
    </>
  );
};

export default Zoom;
