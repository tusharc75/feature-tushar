import { Button, Dialog, makeStyles } from '@material-ui/core'
import Carousel from "react-material-ui-carousel";

import CustomDialogHeader from '../CustomDialog/CustomDialogHeader'
import CustomDialogContent from '../CustomDialog/CustomDialogContent'
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter'

const useStyles = makeStyles(() => ({
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    maxWidth: "500px",
  }
}));


const CarouselDialog = ({ images, index, close }) => {
  const classes = useStyles();
 
    return (
        <Dialog maxWidth="md" fullWidth open={true} onClose={close}>
        <CustomDialogHeader title="Image Carousel" onClose={close} showRequiredLabel={false}/>
          <CustomDialogContent>
          <Carousel
            strictIndexing
            animation="slide"
            autoPlay={false}
            index={index}
            navButtonsAlwaysVisible
          >
            {images.map((item: any, i) => (
              <div key={i} className={classes.imageContainer}>
                <img className={classes.img} src={item} alt={item} />
              </div>
            ))}
          </Carousel>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="contained" color='primary' onClick={close}>Close</Button>
          </CustomDialogFooter>
        </Dialog>
    )
}

export default CarouselDialog
