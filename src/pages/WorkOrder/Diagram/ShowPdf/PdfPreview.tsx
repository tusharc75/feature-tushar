import { useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { asyncForEach, convertBlobToBase64 } from 'src/constants/helpers';
import { Box, FormControl, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';

fabric.IText.prototype.initHiddenTextarea = (function (initHiddenTextarea) {
  return function () {
    var result = initHiddenTextarea.apply(this);
    fabric.document.body.removeChild(this.hiddenTextarea);
    this.canvas.wrapperEl.appendChild(this.hiddenTextarea);
    return result;
  };
})(fabric.IText.prototype.initHiddenTextarea);

const PdfPreview = ({ data, fetchData, setSelectedAttachment }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastConfig = useContext(CustomToastContext);
  const [canvas, setCanvas] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [pageImages, setPageImages] = useState([]);
  const [canvasStates, setCanvasStates] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [highlighterPaths, setHighlighterPaths] = useState([]);
  const [brushPaths, setBrushPaths] = useState([]);
  const [originalDimensions, setOriginalDimensions] = useState({ width: null, height: null });
  const [isHighlighterMode, setHighlighterMode] = useState(false);

  useEffect(() => {
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
      'selection:updated': onObjectSelected,
      'selection:created': onObjectSelected,
      'selection:cleared': onObjectSelected
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
      .get(`/user/pdf?fileName=${data?.url}&attachmentId=${data?.attachmentId}`)
      .then(({ data }) => {
        const images = data.map((bufferData) => {
          const buffer = new Uint8Array(bufferData.data);
          const blob = new Blob([buffer], { type: 'image/png' });
          return URL.createObjectURL(blob);
        });

        setPageImages(images);
        setCanvasStates(images?.map(() => null)); //initalising canvasStates to null

        loadPageToCanvas(images[0], fabricCanvas, 0); //loading first page to canvas
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const loadPageToCanvas = (imageUrl, fabricCanvas, pageIndex) => {
    if (canvasStates[pageIndex]) {
      fabricCanvas.loadFromJSON(canvasStates[pageIndex], fabricCanvas.renderAll.bind(fabricCanvas));
    } else {
      fabric.Image.fromURL(imageUrl, (img) => {
        setOriginalDimensions({ width: img.width, height: img.height });
        fabricCanvas.clear();
        fabricCanvas.setDimensions({ width: img.width, height: img.height });
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
        setCanvasStates((prevCanvasStates) => {
          const updatedCanvasStates = [...prevCanvasStates];
          updatedCanvasStates[pageIndex] = JSON.stringify(fabricCanvas.toJSON());
          return updatedCanvasStates;
        });
      });
    }
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

    const imageData = [];

    const updatedCanvasStates = [...canvasStates];
    updatedCanvasStates[currentPageIndex] = JSON.stringify(canvas.toJSON());

    await asyncForEach(pageImages, async (imageUrl, index) => {
      const canvasState = updatedCanvasStates[index];
      if (canvasState) {
        const tempCanvas = new fabric.Canvas();
        tempCanvas.setWidth(originalDimensions.width);
        tempCanvas.setHeight(originalDimensions.height);

        await new Promise((resolve) => {
          tempCanvas.loadFromJSON(canvasState, () => {
            imageData.push(tempCanvas.toDataURL({ format: 'image/png', multiplier: 1 }));
            tempCanvas.dispose();
            resolve(undefined);
          });
        });
      } else {
        const dataUrl = await convertBlobToBase64(imageUrl);
        imageData.push(dataUrl);
      }
    });

    axiosInstance()
      .post('/user/pdf', { images: imageData, fileName: data?.url, attachmentId: data?.attachmentId })
      .then(() => {
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
    axiosInstance()
      .get(`/user/download?fileName=${encodeURIComponent(data?.url)}`, { responseType: 'blob' })
      .then((res) => {
        const blobData = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blobData);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${data?.url}`);
        link.click();
      });
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
      canvas.isDrawingMode = false;
      setCanvas(canvas);
      canvas.off('path:created');
    }
  };

  const toggleHighlighterMode = () => {
    if (isHighlighterMode) {
      exitHighlighterMode();
    } else {
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

        img.scale(scalingFactor);

        img.set({
          left: (canvasWidth - img.width * img.scaleX) / 2,
          top: (canvasHeight - img.height * img.scaleY) / 2
        });
        canvas.add(img).renderAll();
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNextPage = () => {
    setCanvasStates((prevCanvasStates) => {
      const updatedCanvasStates = [...prevCanvasStates];
      updatedCanvasStates[currentPageIndex] = JSON.stringify(canvas.toJSON());
      return updatedCanvasStates;
    });
    loadPageToCanvas(pageImages[currentPageIndex + 1], canvas, currentPageIndex + 1);
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const handlePreviousPage = () => {
    setCanvasStates((prevCanvasStates) => {
      const updatedCanvasStates = [...prevCanvasStates];
      updatedCanvasStates[currentPageIndex] = JSON.stringify(canvas.toJSON());
      return updatedCanvasStates;
    });
    loadPageToCanvas(pageImages[currentPageIndex - 1], canvas, currentPageIndex - 1);
    setCurrentPageIndex(currentPageIndex - 1);
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
            disabled={loading || isDrawingMode}
            onClick={toggleDrawingMode}
          >
            {isDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
          </ThemeButton>
          {(isDrawingMode || isHighlighterMode) && (
            <ThemeButton
              disabled={loading}
              onClick={handleUndo}
            >
              Undo
            </ThemeButton>
          )}
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          <ThemeButton
            disabled={loading || isDrawingMode || isHighlighterMode}
            onClick={() => {
              fileInputRef.current.click();
            }}            >
            Upload Watermark
          </ThemeButton>
          <ThemeButton
            disabled={loading || isDrawingMode || currentPageIndex === 0 || isHighlighterMode}
            onClick={handlePreviousPage}
          >
            Previous Page
          </ThemeButton>
          <ThemeButton
            disabled={loading || isDrawingMode || currentPageIndex === pageImages?.length - 1 || isHighlighterMode}
            onClick={handleNextPage}
          >
            Next Page
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
            onClick={handleSave}
          >
            Save
          </ThemeButton>
          <ThemeButton
            disabled={loading}
            buttonType="theme"
            onClick={handleDownload}
          >
            Download
          </ThemeButton>
        </div>
      </div>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }} style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}>
          {loading ? (
            <Box pt={2}>
              <Typography>Pdf Pages Loading...</Typography>
            </Box>
          ) : null}
          <canvas ref={canvasRef} />
          {!loading && (
            <Box ml={2}>
              Page {currentPageIndex + 1} of {pageImages?.length}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PdfPreview;
