import { Dialog } from '@mui/material';
import Carousel from 'react-material-ui-carousel';

import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import imageLoadingFailed from 'src/assets/imageLoadingFailed.png';
import { isMobile, isTablet } from 'react-device-detect';

type CarouselDialogProps = {
  images: string[];
  index?: number;
  close: () => void;
  title?: string;
  headerComponent?: React.ReactNode;
  carouselProps?: Partial<Parameters<typeof Carousel>[0]>;
  resolveUrl?: (url: string) => Promise<string>;
};

const CarouselDialog = ({ images, index = 0, close, title = 'Images', headerComponent, carouselProps = {}, resolveUrl }: CarouselDialogProps) => {
  const [fullScreen, setFullScreen] = useState(isMobile && !isTablet);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxSize, setMaxSize] = useState({ maxWidth: 600, maxHeight: 600 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      setMaxSize({ maxWidth: rect.width, maxHeight: rect.height - 80 });
    }
  }, [containerRef, fullScreen]);

  return (
    <Dialog fullScreen={fullScreen} slots={{ transition: CustomDialogTransition }} maxWidth="md" fullWidth open={true} onClose={close}>
      <CustomDialogHeader
        title={title}
        onClose={close}
        showRequiredLabel={false}
        showManimizeMaximize
        onMinimizeMaximize={() => setFullScreen((prev) => !prev)}
        isMinimized={!fullScreen}
      />
      <CustomDialogContent sx={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
        {headerComponent}
        <div className="flex flex-grow flex-col justify-center" ref={containerRef}>
          <Carousel
            strictIndexing
            animation="slide"
            key={JSON.stringify(maxSize)}
            autoPlay={false}
            index={index}
            navButtonsProps={{
              className: images.length > 1 ? 'visible' : '!hidden'
            }}
            navButtonsAlwaysVisible={images.length > 1}
            indicatorContainerProps={{
              className: images.length > 1 ? 'visible' : '!hidden'
            }}
            {...carouselProps}
          >
            {images.map((item: string, i) => (
              <RenderSingleImage src={item} index={i} resolveUrl={resolveUrl} key={`${i}-${item}`} maxSize={maxSize} />
            ))}
          </Carousel>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default CarouselDialog;

const RenderSingleImage = ({
  src,
  maxSize,
  resolveUrl,
  index
}: {
  src: string;
  resolveUrl?: CarouselDialogProps['resolveUrl'];
  maxSize: {
    maxWidth: number;
    maxHeight: number;
  };
  index: number;
}) => {
  const [url, setUrl] = useState(src);

  const handleOnError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = imageLoadingFailed;
    target.classList.add('max-h-[200px]', 'max-w-[200px]', 'rounded-md');
    target.width = 200;
    target.height = 200;
    target.style.width = '200px';
    target.style.height = '200px';
  };

  useEffect(() => {
    const getUrl = async () => {
      if (typeof resolveUrl === 'function') {
        const url = await resolveUrl(src);
        setUrl(url);
      } else {
        setUrl(src);
      }
    };
    getUrl();
  }, [src]);

  return (
    <div className="mx-auto flex max-h-full max-w-full items-center justify-center">
      {url && (
        <img
          draggable={false}
          onError={handleOnError}
          className={cn('h-auto max-h-full w-auto object-contain')}
          style={maxSize}
          src={url}
          alt={''}
          loading="lazy"
        />
      )}
    </div>
  );
};
