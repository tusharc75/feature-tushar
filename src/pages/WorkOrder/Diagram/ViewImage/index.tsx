import { Box, Button } from '@material-ui/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import CustomImage from './CustomImage';
import { useAppTheme } from 'src/constants/AppConfig';
import CustomText from './CustomText';

type TextType = {
  fontSize: number;
  fill: string;
  text: string;
  id: number;
  isDragging: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

const ViewImage = ({ data }) => {
  const [themeColor] = useAppTheme();
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const editingTextRef = useRef(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [imageState, setImageState] = useState(null);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [selectedText, selectText] = useState(null);
  const [editingText, setEditingText] = useState<TextType>(null);
  const [transformImage, setTransformImage] = useState(false);

  const stageColor = useMemo(() => {
    if (themeColor === 'light') {
      return 'white';
    } else {
      return '#0e0e23';
    }
  }, [themeColor]);

  const textColor = useMemo(() => {
    if (themeColor === 'light') {
      return '#000';
    } else {
      return '#fff';
    }
  }, [themeColor]);

  useEffect(() => {
    setImageState({
      url: data?.url,
      id: data?._id,
      name: data?.name,
      x: 150,
      isDragging: false,
      y: 0,
      width: 400,
      height: 400
    });
  }, [data]);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.getCanvas()._canvas.id = 'canvas_layer';
  }, [layerRef.current]);

  const handleAddText = () => {
    const defaultTextConfig = { fontSize: 16, fill: 'black', text: '', id: 1, isDragging: false, x: 50, y: 80, width: 100, height: 20 };
    setTexts((state) => {
      return [...state, { ...defaultTextConfig, id: texts.length + 1, text: `New Text - ${state.length + 1}` }];
    });
  };

  return (
    <Box>
      <Box mb={1} display="flex">
        <Button size="small" variant="outlined" color="primary" onClick={handleAddText}>
          Add Text
        </Button>
        <Box component="span" mx={1} />
      </Box>

      <Stage
        ref={(node) => {
          stageRef.current = node;
        }}
        style={{ backgroundColor: 'var(--dark-primary, #D3D3D3)' }}
        width={window.innerWidth - 700}
        height={window.innerHeight - 250}
        onClick={(e) => {
          if (!e.target.attrs.hasOwnProperty('id') || e.target.attrs.id !== 'image') {
            setTransformImage(false);
          }
          if ((!e.target.attrs.hasOwnProperty('id') || e.target.attrs.id !== 'canvasText') && !editingText) {
            selectText(null);
            setEditingText(null);
            if (editingTextRef.current) {
              editingTextRef.current.textRef.show();
              editingTextRef.current.transformRef.show();
              editingTextRef.current.transformRef.forceUpdate();
              editingTextRef.current = null;
            }
          }
        }}
      >
        <Layer ref={layerRef}>
          <Rect x={0} y={0} width={stageRef.current?.width()} height={stageRef.current?.height()} fill={stageColor} />
          {imageState && (
            <CustomImage
              setImageState={setImageState}
              imageState={imageState}
              key={imageState?._id}
              transformImage={transformImage}
              onTransformImage={() => {
                setTransformImage(true);
              }}
              textProps={{
                fill: textColor
              }}
            />
          )}
          {texts.length > 0 &&
            texts?.map((text) => (
              <CustomText
                fill={textColor}
                key={text.id}
                onSelect={() => selectText(text.id)}
                onEdit={() => setEditingText(text)}
                textState={text}
                setTextState={setTexts}
                selectedId={selectedText === text.id}
                editingText={editingText}
                editingTextRef={editingTextRef}
              />
            ))}
        </Layer>
      </Stage>
      {editingText && (
        <textarea
          autoFocus
          ref={inputRef}
          style={{
            position: 'absolute',
            top: `${stageRef.current.container().offsetTop + editingText.y}px`,
            left: `${stageRef.current.container().offsetLeft + editingText.x}px`,
            width: editingText.width,
            overflow: 'hidden',
            resize: 'none',
            outline: 'none',
            border: 'none',
            margin: 0,
            padding: 0,
            fontSize: editingText.fontSize,
            background: 'none',
            color: editingText.fill
          }}
          onKeyDown={(e) => {
            if (e?.keyCode === 13) {
              setTexts((state) =>
                state.map((s) => ({
                  ...s,
                  text: editingText.id === s.id ? editingText.text : s.text
                }))
              );
              setEditingText(null);
              editingTextRef.current.textRef.show();
              editingTextRef.current.transformRef.show();
              editingTextRef.current.transformRef.forceUpdate();
              editingTextRef.current = null;
            }
          }}
          value={editingText.text}
          onChange={(e) => {
            const val = e.target.value;
            setEditingText((pState) => ({ ...pState, text: val }));
          }}
        />
      )}
    </Box>
  );
};

export default ViewImage;
