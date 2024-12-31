import { Dialog } from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import { makeStyles } from '@mui/styles';

import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
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
  const classList = ['min-h-[300px]', 'bg-gray-300', 'dark:bg-gray-800'];
  const handleOnload = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.classList.remove(...classList);
  };

  const handleOnError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = imageLoadingFailed;
    target.classList.remove(...classList);
    target.classList.add('max-h-[200px]', 'max-w-[200px]', 'rounded-md');
    target.width = 300;
    target.height = 300;
  };

  return (
    <Dialog TransitionComponent={CustomDialogTransition} maxWidth="md" fullWidth open={true} onClose={close}>
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
              <img onError={handleOnError} onLoad={handleOnload} className={cn(classes.img, ...classList)} src={item} alt={''} loading="lazy" />
            </div>
          ))}
        </Carousel>
      </CustomDialogContent>
    </Dialog>
  );
};

export default CarouselDialog;
