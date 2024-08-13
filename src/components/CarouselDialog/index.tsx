import { Dialog, makeStyles } from '@material-ui/core';
import Carousel from 'react-material-ui-carousel';

import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';

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
              <img className={classes.img} src={item} alt={''} />
            </div>
          ))}
        </Carousel>
      </CustomDialogContent>
    </Dialog>
  );
};

export default CarouselDialog;
