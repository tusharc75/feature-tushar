import { useRef, useState, useEffect } from 'react';
import useImage from 'use-image';
import { Image, Text, Transformer } from 'react-konva';
import type { ImageConfig } from 'konva/lib/shapes/Image';
import type { TextConfig } from 'konva/lib/shapes/Text';

interface ImageRenderProps extends Omit<ImageConfig, 'image'> {
  textProps?: TextInterface;
}
interface TextInterface extends TextConfig {}

const ImageRender: React.FC<ImageRenderProps> = ({
  onTransformImage,
  transformImage,
  imageRef,
  setImageState,
  imageState,
  url,
  trRef,
  textProps,
  ...others
}) => {
  const [image] = useImage(url);

  const handleDrag = (isDragging: boolean) => (e) => {
    setImageState({ ...imageState, isDragging: isDragging, x: e.target.x(), y: e.target.y() });
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.02;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const point = stage.getPointerPosition();
    
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: point.x / oldScale - stage.x() / oldScale,
      y: point.y / oldScale - stage.y() / oldScale
    };


    setImageState({
      scale: newScale,
      x: (point.x / newScale - mousePointTo.x) * newScale,
      y: (point.y / newScale - mousePointTo.y) * newScale,      
    });
  };

  return (
    <>
      <Image
        {...others}
        id="image"
        ref={imageRef}
        draggable
        width={imageState.width}
        height={imageState.height}
        image={image}
        onTap={onTransformImage}
        onClick={onTransformImage}
        onWheel={handleWheel}
        x={imageState.x}
        y={imageState.y}
        onDragStart={() => {
          setImageState({ ...imageState, isDragging: true });
        }}
        onDragMove={handleDrag(true)}
        onDragEnd={handleDrag(false)}
        onTransformEnd={(e) => {
          const node = imageRef.current;
          const scaleX = node?.scaleX();
          const scaleY = node?.scaleY();

          // we will reset it back
          node?.scaleX(1);
          node?.scaleY(1);
          setImageState({
            ...imageState,
            x: node?.x(),
            y: node?.y(),
            width: Math.max(5, node?.width() * scaleX),
            height: Math.max(node?.height() * scaleY)
          });
        }}
      />
      {transformImage && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const CustomImage: React.FC<ImageRenderProps> = ({ url, onTransformImage, transformImage, imageState, setImageState, textProps, ...others }) => {
  const imageRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    trRef.current?.nodes([imageRef.current]);
    trRef.current?.getLayer().batchDraw();
  }, [transformImage]);

  return (
    <>
      <ImageRender
        {...others}
        imageRef={imageRef}
        setImageState={setImageState}
        imageState={imageState}
        transformImage={transformImage}
        onTransformImage={onTransformImage}
        url={url}
        trRef={trRef}
        textProps={textProps}
      />
    </>
  );
};

export default CustomImage;
