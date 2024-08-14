import { Dialog, makeStyles } from '@material-ui/core';
import Carousel from 'react-material-ui-carousel';

import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { cn } from 'src/constants/helpers';
import { SyntheticEvent } from 'react';
import imageLoadingFailed from 'src/assets/imageLoadingFailed.png';

const useStyles = makeStyles(() => ({
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  img: {
    maxWidth: '500px'
  }
}));

type CarouselDialogProps = {
  images: string[];
  index: number;
  close: () => void;
  title?: string;
};

const CarouselDialog = ({ images, index, close, title = 'Images' }: CarouselDialogProps) => {
  const classes = useStyles();

  const handleOnload = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.classList.remove('bg-gray-300', 'min-h-[400px]', 'dark:bg-gray-800', 'rounded-md', 'max-h-[200px]', 'max-w-[200px]');
  };
  const handleOnError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = imageLoadingFailed;
    target.classList.add('max-h-[200px]', 'max-w-[200px]', 'rounded-md');
  };

  return (
    <Dialog maxWidth="md" fullWidth open={true} onClose={close}>
      <CustomDialogHeader title={title} onClose={close} showRequiredLabel={false} />
      <CustomDialogContent>
        <Carousel
          strictIndexing
          animation="slide"
          autoPlay={false}
          index={index}
          navButtonsProps={{
            className: images.length > 1 ? 'visible' : '!hidden'
          }}
          navButtonsAlwaysVisible={images.length > 1}
          indicatorContainerProps={{
            className: images.length > 1 ? 'visible' : '!hidden'
          }}
        >
          {images.map((item: any, i) => (
            <div key={i} className={classes.imageContainer}>
              <img
                onError={handleOnError}
                onLoad={handleOnload}
                className={cn(classes.img, 'min-h-[300px] rounded-md bg-gray-300 dark:bg-gray-800')}
                src={item}
                alt={''}
                loading="lazy"
              />
            </div>
          ))}
        </Carousel>
      </CustomDialogContent>
    </Dialog>
  );
};

export default CarouselDialog;
