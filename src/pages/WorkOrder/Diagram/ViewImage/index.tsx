import { Box, Button } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import CustomImage from './CustomImage';
import { useAppTheme } from 'src/constants/AppConfig';
import CustomText from './CustomText';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from 'src/components/Loader';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

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

const ViewImage = ({ data, loading, setLoading }) => {
  const toastConfig = useContext(CustomToastContext);
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
  const [url, setUrl] = useState();
  const [widthHeight, setWidthHeight] = useState({
    width: window.innerWidth - 700,
    height: window.innerHeight - 250
  });

  const containerRef = useRef<HTMLDivElement>(null);

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
      name: data?.name,
      x: 150,
      isDragging: false,
      y: 0,
      width: 400,
      height: 400
    });

    axiosInstance()
      .get('/user/download?fileName=' + data?.url, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
          let base64data: any = reader.result;
          setUrl(base64data);
          setLoading(false);
        };
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
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

  const watchContainerSize = React.useCallback(() => {
    if (containerRef.current) {
      setWidthHeight({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight - 38
      });
    }
  }, []);

  useEffect(() => {
    watchContainerSize();
    window.addEventListener('resize', watchContainerSize);
    return () => window.removeEventListener('resize', watchContainerSize);
  }, [watchContainerSize]);

  return (
    <div className="absolute inset-2" ref={containerRef}>
      <Box mb={1} display="flex">
        <Button size="small" variant="outlined" color="primary" onClick={handleAddText}>
          Add Text
        </Button>
        <Box component="span" mx={1} />
      </Box>
      {!loading ? (
        <Stage
          ref={(node) => {
            stageRef.current = node;
          }}
          style={{ backgroundColor: 'transparent' }}
          width={widthHeight.width}
          height={widthHeight.height}
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
                url={url}
                setImageState={setImageState}
                imageState={imageState}
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
      ) : (
        <Loader style={{ minHeight: 500 }} text="Loading..." />
      )}
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
    </div>
  );
};

export default ViewImage;
