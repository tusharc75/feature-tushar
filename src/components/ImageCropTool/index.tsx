import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
    Button,
    Box,
    Grid,
    Typography,
    Slider,
  } from "@material-ui/core";
import getCropppedImg from "./cropImage";

import "./cropImageStyles.scss"

const ImageCropTool = (props) => {
    const {image, setImages,setImage } = props
    // const [image, setImage] = useState<any>("");
    // const [images, setImages] = useState([]);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState<any>(0);
    const [zoom, setZoom] = useState<any>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [croppingImg, setCroppingImg] = useState(false);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
      }, []);
    
    const showCroppedImage = useCallback(async () => {
        setCroppingImg(true)  
        try {
            
          const croppedImage: any = await getCropppedImg(
            image,
            croppedAreaPixels,
            rotation
          );

          setCroppedImage(croppedImage);
          setImages((prevState) => [...prevState, croppedImage]);
          setCrop({x:0,y:0})
          setZoom(1)
          setRotation(0)
          setCroppedAreaPixels(null)
          setCroppingImg(false)  
          setImage("");
          
        } catch (error) {
          setCroppingImg(false)  
          console.log(error);
        }
      }, [croppedAreaPixels, rotation]);
    
    //   const onClose = useCallback(() => {
    //     setCroppedImage(null);
    //   }, []);
    
    //   const onImageSelect = (e: any) => {
    //     const file = e.target.files[0];
    //     let reader = new FileReader();
    //     reader.onload = (e) => {
    //       setImage(e.target?.result);
    //     };
    //     reader.readAsDataURL(file);
    //   };
    
    
    return (
        <div>
            <div className="cropContainer">
                <Cropper
                image={image}
                crop={crop}
                rotation={rotation}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                />
            </div>
            <Box mt={2}>
                <Grid container>
                <Grid item xs={6} className="sliderPadding">
                    <Typography>Zoom</Typography>
                    <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(_, zoom) => setZoom(zoom)}
                    />
                </Grid>
                <Grid item xs={6} className="sliderPadding">
                    <Typography>Rotation</Typography>
                    <Slider
                        value={rotation}
                        min={0}
                        max={360}
                        step={0.1}
                        aria-labelledby="Rotation"
                        onChange={(_, rotation) => setRotation(rotation)}
                    />
                </Grid>
                </Grid>
                <div className="px-1">
                <Button
                    onClick={showCroppedImage}
                    color="primary"
                    variant="contained"
                    fullWidth
                    disabled={croppingImg}
                >
                    Crop Image
                </Button>
                </div>
            </Box>
        
    </div>
    )
}

export default ImageCropTool
