import { useState, useCallback, useContext, Fragment } from 'react';
import Cropper from 'react-easy-crop';
import { Button, Box, Grid, Typography, Slider } from '@material-ui/core';
import getCropppedImg from './cropImage';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

import './cropImageStyles.scss';
import { b64toBlob } from '../../constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const ImageCropTool = (props) => {
  const { image, getImageUrl, isImgUploading, imageUploadProgress, imageFileName, setImage } = props;
  const { setToastConfig } = useContext(CustomToastContext);
  // const [image, setImage] = useState<any>("");
  // const [images, setImages] = useState([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<any>(0);
  const [zoom, setZoom] = useState<any>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [croppingImg, setCroppingImg] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    setCroppingImg(true);
    try {
      let blob: any;
      const croppedImage: any = isEditing ? await getCropppedImg(image, croppedAreaPixels, rotation) : b64toBlob(image);

      if (isEditing) {
        blob = await fetch(croppedImage)
          .then((res) => res.blob())
          .then((blobFile) => new File([blobFile], imageFileName, { type: 'image/png' }));
      } else {
        blob = croppedImage;
      }

      getImageUrl(blob, Boolean(blob));
      setCroppedImage(croppedImage);
      // setImages((prevState) => [...prevState, croppedImage]);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setCroppingImg(false);
    } catch (error) {
      setCroppingImg(false);
      setToastConfig({ open: true, type: 'error', message: 'Something went wrong!' });
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
    <>
      <CustomDialogHeader
        showRequiredLabel={false}
        onClose={() => {
          if (!isImgUploading) {
            setImage('');
          }
        }}
        title="Edit Image"
      />
      <CustomDialogContent isFooterPresent={true}>
        <div className="cropperImageContainer">
          {isImgUploading && (
            <div className="containerOverlay">
              <div className="lds-dual-ring">
                <p>{imageUploadProgress}%</p>
              </div>
              <p>Uploading Image...</p>
            </div>
          )}
          {isEditing ? (
            <Fragment>
              <div className="sticky -top-[30px] z-10 flex gap-5 bg-[var(--dark-primary,white)] px-2">
                <div className="basis-full md:basis-1/2">
                  <Typography>Zoom</Typography>
                  <Slider value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(_, zoom) => setZoom(zoom)} />
                </div>
                <div className="basis-full md:basis-1/2">
                  <Typography>Rotation</Typography>
                  <Slider
                    value={rotation}
                    min={0}
                    max={360}
                    step={0.1}
                    aria-labelledby="Rotation"
                    onChange={(_, rotation) => setRotation(rotation)}
                  />
                </div>
              </div>
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
            </Fragment>
          ) : (
            <Fragment>
              <Box mb={2} width={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                <Box width={'80%'}>
                  <img width={'100%'} src={image} alt={imageFileName} />
                </Box>
              </Box>
            </Fragment>
          )}
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button onClick={() => setIsEditing(!isEditing)} color="primary" variant="contained" fullWidth disabled={croppingImg || isImgUploading}>
          {isEditing ? 'Cancel Edit' : 'Edit'}
        </Button>
        <Box mx={1} />
        <Button onClick={showCroppedImage} color="primary" variant="contained" fullWidth disabled={croppingImg || isImgUploading}>
          {croppingImg ? 'Processing Image...' : isImgUploading ? 'Uploading Image...' : isEditing ? 'Crop & Upload Image' : 'Upload Image'}
        </Button>
      </CustomDialogFooter>
    </>
  );
};

export default ImageCropTool;
