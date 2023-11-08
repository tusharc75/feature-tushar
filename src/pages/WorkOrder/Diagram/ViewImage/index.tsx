import { Box, Button } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import CustomImage from './CustomImage';
import { useAppTheme } from 'src/constants/AppConfig';
import CustomText from './CustomText';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from 'src/components/Loader';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { b64toBlob } from 'src/constants/helpers';
import axios from 'axios';

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

const ViewImage = ({ data, fetchData }) => {
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
  const [loading, setLoading] = useState(true);

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

  const getImageScale = (url: string, canvasSize: { width: number; height: number }, maxSize: number = 400) => {
    const image = new Image();
    image.src = url;
    image.onload = function () {
      scaleToFit(this);
    };
    function scaleToFit(img) {
      const scale = Math.min(canvasSize.width / img.width, canvasSize.height / img.height, maxSize / img.height, maxSize / img.width);

      // get the top left position of the image
      const x = canvasSize.width / 2 - (img.width / 2) * scale;
      const y = canvasSize.height / 2 - (img.height / 2) * scale;
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;
      setImageState({
        name: data?.name,
        x,
        y,
        isDragging: false,
        width: imgWidth,
        height: imgHeight
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const source = axios.CancelToken.source();

    axiosInstance()
      .get('/user/download?fileName=' + data?.url, {
        responseType: 'blob',
        cancelToken: source.token
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
          let base64data: any = reader.result;
          setUrl(base64data);
          getImageScale(base64data, widthHeight, 500);
        };
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    return () => {
      source.cancel();
    };
  }, [data?.url]);

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

  const handleSave = async () => {
    const canvasElement: any = document.getElementById('canvas_layer');
    const imgURL = canvasElement?.toDataURL();

    const blob: any = b64toBlob(imgURL);
    const type = `image/${data?.url?.split('.')[1]}`;

    const file: any = new File([blob], data?.name, { type });

    let formData = new FormData();
    formData.append('file', file);

    const res = await axiosInstance().post('/user/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    axiosInstance()
      .put(`/attachment/resource-attachment-type/${data?.attachmentId}`, {
        oldUrl: data?.url,
        url: res?.data?.fileName,
        date: new Date()
      })
      .then(({ data }) => {
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <div className="absolute inset-2" ref={containerRef}>
      <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Button size="small" variant="outlined" color="primary" onClick={handleAddText}>
            Add Text
          </Button>
          {selectedText && !editingText && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                setTexts((state) => state.filter((s) => s.id !== selectedText));
                if (selectedText) selectText(null);
                if (editingText) setEditingText(null);
                if (!editingTextRef) {
                  editingTextRef.current.textRef.show();
                  editingTextRef.current.transformRef.show();
                  editingTextRef.current.transformRef.forceUpdate();
                  editingTextRef.current = null;
                }
              }}
            >
              Remove Text
            </Button>
          )}
        </Box>
        <Button disabled={texts?.length > 0 ? false : true} size="small" variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
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
