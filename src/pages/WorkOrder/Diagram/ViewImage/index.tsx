import { useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { b64toBlob } from 'src/constants/helpers';
import { Box, FormControl, Typography } from '@mui/material';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';

fabric.IText.prototype.initHiddenTextarea = (function (initHiddenTextarea) {
  return function () {
    var result = initHiddenTextarea.apply(this);
    fabric.document.body.removeChild(this.hiddenTextarea);
    this.canvas.wrapperEl.appendChild(this.hiddenTextarea);
    return result;
  };
})(fabric.IText.prototype.initHiddenTextarea);

const ViewImage = ({ data, fetchData, setSelectedAttachment }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastConfig = useContext(CustomToastContext);
  const [canvas, setCanvas] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [highlighterPaths, setHighlighterPaths] = useState([]);
  const [isHighlighterMode, setHighlighterMode] = useState(false);
  const [brushPaths, setBrushPaths] = useState([]);
  const isSelected = useRef(false);

  useEffect(() => {
    // for touchScroll
    (function () {
      const addListener = fabric.util.addListener,
        removeListener = fabric.util.removeListener,
        addEventOptions = { passive: false };

      fabric.util.object.extend(
        fabric.Canvas.prototype,
        /** @lends fabric.Canvas.prototype */ {
          _onTouchStart: function (e) {
            // prevent touchScroll if any objce is currently selected
            if (isSelected.current) e.preventDefault();
            if (this.mainTouchId === null) {
              this.mainTouchId = this.getPointerId(e);
            }
            this.__onMouseDown(e);
            this._resetTransformEventData();
            const canvasElement = this.upperCanvasEl,
              eventTypePrefix = this._getEventPrefix();
            addListener(fabric.document, 'touchend', this._onTouchEnd, addEventOptions);
            addListener(fabric.document, 'touchmove', this._onMouseMove, addEventOptions);
            // Unbind mousedown to prevent double triggers from touch devices
            removeListener(canvasElement, eventTypePrefix + 'down', this._onMouseDown);
          }
        }
      );
    })();

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: false,
      controlsAboveOverlay: true,
      centeredScaling: true,
      allowTouchScrolling: true
    });
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerStyle = 'circle';
    fabricCanvas.on({
      'selection:updated': (obj) => {
        onObjectSelected(obj);
      },
      'selection:created': (obj) => {
        isSelected.current = true;
        onObjectSelected(obj);
      },
      'selection:cleared': (obj) => {
        isSelected.current = false;
        onObjectSelected(obj);
      }
    });
    setCanvas(fabricCanvas);
    loadImage(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, [data]);

  const loadImage = (fabricCanvas) => {
    if (canvasRef.current) {
      canvasRef.current.style.border = 'none';
    }
    setLoading(true);
    axiosInstance()
      .get('/user/download?fileName=' + encodeURIComponent(data?.url), {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const imageType = 'image/png'; // or 'image/png'
        const file = new Blob([data], { type: imageType });
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
          fabric.Image.fromURL(reader.result, (img) => {
            fabricCanvas.setDimensions({ width: img.width, height: img.height });
            fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
            if (canvasRef.current) {
              canvasRef.current.style.border = '1px solid #2a2a2a';
            }
            setLoading(false);
          });
        };
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const handleAddText = () => {
    const id = new Date().getMilliseconds();
    const newText = new fabric.IText('New Text', {
      left: 100,
      top: 100,
      fill: 'black',
      id: id,
      editable: true
    });
    canvas.add(newText);
  };

  const handleAddLine = () => {
    const id = new Date().getMilliseconds();
    const newLine = new fabric.Line([50, 100, 200, 200], {
      left: 100,
      top: 100,
      stroke: 'black',
      id: id
    });
    canvas.add(newLine);
  };

  const handleAddRectangle = () => {
    const id = new Date().getMilliseconds();
    const newRectangle = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'black',
      id: id,
      width: 50,
      height: 50
    });
    canvas.add(newRectangle);
  };

  const handleAddCircle = () => {
    const id = new Date().getMilliseconds();
    const newCircle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: 'black',
      id: id,
      radius: 20
    });
    canvas.add(newCircle);
  };

  const handleRemoveObject = (obj) => {
    if (obj.highlighter) {
      const index = highlighterPaths.indexOf(obj);
      if (index !== -1) {
        highlighterPaths.splice(index, 1);
      }
    }
    canvas.remove(obj);
    canvas.requestRenderAll();
  };

  const handleRemove = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'activeSelection') {
        activeObject.forEachObject(handleRemoveObject);
      } else {
        handleRemoveObject(activeObject);
      }
      canvas.discardActiveObject();
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    const imgURL = canvas.toDataURL();
    const blob: any = b64toBlob(imgURL);
    const type = `image/${data?.url?.split('.')[1]}`;
    const file: any = new File([blob], data?.name, { type });
    let formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance().post('/user/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    axiosInstance()
      .put(`/attachment/replace/${data?.attachmentId}`, { oldUrl: data?.url, url: res?.data?.fileName })
      .then(({ data }) => {
        setSelectedAttachment(null);
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  const handleDownload = () => {
    const imgURL = canvas.toDataURL();
    const link = document.createElement('a');
    link.href = imgURL;
    link.setAttribute('download', data?.url);
    document.body.appendChild(link);
    link.click();
  };

  const onObjectSelected = (obj) => {
    if (obj.selected && obj.selected?.length) {
      setSelectedObject(obj.selected[0]);
    } else {
      setSelectedObject(null);
    }
  };

  const handleColorChange = (event) => {
    const newColor = event.target.value;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      if (activeObject.type === 'activeSelection') {
        activeObject.forEachObject((obj) => {
          if (obj.type === 'line' || obj.type === 'path') {
            obj.set('stroke', newColor);
          } else {
            obj.set('fill', newColor);
          }
        });
      } else if (activeObject && activeObject.ishighlighter) {
        const highlighterOpacity = 0.2; // Set your desired opacity value
        const rgbaColor = fabric.Color.fromHex(newColor).setAlpha(highlighterOpacity).toRgba();

        activeObject.set({
          stroke: rgbaColor,
          strokeWidth: 10
        });

        canvas.requestRenderAll();
      } else {
        if (activeObject.type === 'line' || activeObject.type === 'path') {
          activeObject.set('stroke', newColor);
        } else if (activeObject.type === 'path') {
          activeObject.set('stroke', newColor);
        } else {
          activeObject.set('fill', newColor);
        }
      }
      canvas.requestRenderAll();
    }
  };

  const handleUndo = () => {
    if (isHighlighterMode) {
      const lastHighlighterPath = highlighterPaths.pop();
      if (lastHighlighterPath) {
        canvas.remove(lastHighlighterPath);
        canvas.requestRenderAll();
      }
    }
    if (isDrawingMode) {
      const lastBrushPath = brushPaths.pop();
      if (lastBrushPath) {
        canvas.remove(lastBrushPath);
        canvas.requestRenderAll();
      }
    }
  };

  const enterHighlighterMode = () => {
    setHighlighterMode(true);

    const highlighterBrush = new fabric.PencilBrush(canvas);
    highlighterBrush.color = 'rgba(255, 255, 0, 0.2)'; // Yellow color with 20% opacity
    highlighterBrush.width = 10; // Highlighter stroke width

    canvas.freeDrawingBrush = highlighterBrush;
    canvas.isDrawingMode = true;

    canvas.on('path:created', (options) => {
      const path = options.path;
      path.set({
        selectable: true,
        evented: true,
        draggable: true,
        ishighlighter: true // Additional property to identify highlighter paths
      });

      setHighlighterPaths((prevPaths) => [...prevPaths, path]);
    });
  };

  const exitHighlighterMode = () => {
    setHighlighterMode(false);
    // Switch back to the normal pencil brush
    canvas.off('path:created');
    const pencilBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush = pencilBrush;
    canvas.isDrawingMode = false;
  };

  const getSelectedColor = () => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      return null;
    }
    if (activeObject.type === 'activeSelection') {
      const objects = activeObject.getObjects();
      if (objects.length === 0) return null;
      return objects[0].type === 'line' || objects[0].type === 'path' ? objects[0].stroke : objects[0].fill;
    } else {
      return activeObject.type === 'line' || activeObject.type === 'path' ? activeObject.stroke : activeObject.fill;
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (!isDrawingMode) {
      isSelected.current = true;
      const drawingBrush = new fabric.PencilBrush(canvas);
      drawingBrush.color = 'black';
      drawingBrush.width = 2;
      canvas.freeDrawingBrush = drawingBrush;
      canvas.isDrawingMode = true;
      canvas.on('path:created', (options) => {
        const path = options.path;
        path.set({
          ishighlighter: false,
          selectable: true,
          evented: true,
          draggable: true
        });
        setBrushPaths((prevPaths) => [...prevPaths, path]);
      });
    } else {
      isSelected.current = false;
      canvas.isDrawingMode = false;
      setCanvas(canvas);
      canvas.off('path:created');
    }
  };

  const toggleHighlighterMode = () => {
    if (isHighlighterMode) {
      isSelected.current = false;
      exitHighlighterMode();
    } else {
      isSelected.current = true;
      enterHighlighterMode();
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (f) {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        let scalingFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height);

        const scaleRelativeToCanvas = 0.9;
        scalingFactor *= scaleRelativeToCanvas;

        // Scale the image
        img.scale(scalingFactor);

        // Set image position to center of the canvas
        img.set({
          left: (canvasWidth - img.width * img.scaleX) / 2,
          top: (canvasHeight - img.height * img.scaleY) / 2
        });

        // Add the image to the canvas
        canvas.add(img).renderAll();
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      <div className="my-2 flex min-h-[40px] flex-wrap items-center justify-between gap-2">
        <div className={'flex flex-wrap gap-2'}>
          <ThemeButton
            disabled={loading || isDrawingMode || isHighlighterMode}
            onClick={handleAddText}
          >
            Add Text
          </ThemeButton>
          <ThemeButton
            disabled={loading || isDrawingMode || isHighlighterMode}
            onClick={handleAddLine}
          >
            Add Line
          </ThemeButton>
          <ThemeButton
            disabled={loading || isDrawingMode || isHighlighterMode}
            onClick={handleAddRectangle}
          >
            Add Rectangle
          </ThemeButton>
          <ThemeButton
            disabled={loading || isDrawingMode || isHighlighterMode}
            onClick={handleAddCircle}
          >
            Add Circle
          </ThemeButton>
          <ThemeButton
            disabled={loading || isDrawingMode}
            onClick={toggleHighlighterMode}
          >
            {isHighlighterMode ? 'Exit highlighter Mode' : 'Enter highlighter Mode'}
          </ThemeButton>
          <ThemeButton
            disabled={loading || isHighlighterMode}
            onClick={toggleDrawingMode}
          >
            {isDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
          </ThemeButton>
          {(isDrawingMode || isHighlighterMode) && (
            <ThemeButton
              disabled={loading}
              onClick={handleUndo}
            > Undo</ThemeButton>
          )}
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          <ThemeButton
            disabled={loading || isDrawingMode || isHighlighterMode}
            onClick={() => {
              fileInputRef.current.click();
            }}
          >
            Upload Watermark
          </ThemeButton>
        </div>
        {selectedObject && (
          <Box className="flex items-center gap-2">
            <FormControl size="small" margin="none" variant="outlined">
              <input type="color" value={getSelectedColor()} onChange={handleColorChange} style={{ marginLeft: '10px' }} />
            </FormControl>
            <DeleteButton mode="light" text="Remove" size="small" onClick={handleRemove} />
          </Box>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <ThemeButton
            disabled={isSubmitting || loading}
            isLoading={isSubmitting}
            buttonType="theme"
            onClick={(e) => {
              handleSave();
            }}
          >
            Save
          </ThemeButton>
          <ThemeButton
            disabled={loading}
            onClick={handleDownload}
            buttonType="theme"
          >
            Download
          </ThemeButton>
        </div>
      </div>
      <Box height={'calc(100vh - 140px)'} width={'calc(100vw - 20px)'} style={{ overflow: 'auto' }}>
        {loading ? (
          <Box pt={2}>
            <Typography>Image Loading...</Typography>
          </Box>
        ) : null}
        <canvas ref={canvasRef} />
      </Box>
    </Box>
  );
};

export default ViewImage;
