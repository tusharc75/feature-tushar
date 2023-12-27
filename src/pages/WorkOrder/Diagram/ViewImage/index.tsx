import { useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { b64toBlob } from 'src/constants/helpers';
import { Box, Button, FormControl } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import DeleteButton from 'src/components/Helpers/DeleteButton';

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
  const [loading, setLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: false,
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
      .get('/user/download?fileName=' + data?.url, {
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


  const handleRemove = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject.type === 'activeSelection') {
      activeObject.forEachObject((obj) => {
        canvas.remove(obj);
      });
    } else {
      canvas.remove(activeObject);
    }
    canvas.discardActiveObject();
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
      } else {
        if (activeObject.type === 'line' || activeObject.type === 'path') {
          activeObject.set('stroke', newColor);
        } else {
          activeObject.set('fill', newColor);
        }
      }
      canvas.requestRenderAll(); // Re-render the canvas to show the color change
    }
  }

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
      canvas.isDrawingMode = true;
      setCanvas(canvas);
    } else {
      canvas.isDrawingMode = false;
      setCanvas(canvas);
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

        let scalingFactor = Math.min(
          canvasWidth / img.width,
          canvasHeight / img.height
        );

        const scaleRelativeToCanvas = 0.9;
        scalingFactor *= scaleRelativeToCanvas;

        // Scale the image
        img.scale(scalingFactor);

        // Set image position to center of the canvas
        img.set({
          left: (canvasWidth - (img.width * img.scaleX)) / 2,
          top: (canvasHeight - (img.height * img.scaleY)) / 2,
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
      <div className="flex flex-wrap items-center justify-between gap-2 min-h-[40px] my-2">
        <div className={'flex gap-2 flex-wrap'}>
          <Button disabled={loading || isDrawingMode} variant="outlined" color="primary" size="small" onClick={handleAddText}>
            Add Text
          </Button>
          <Button disabled={loading || isDrawingMode} variant="outlined" color="primary" size="small" onClick={handleAddLine}>
            Add Line
          </Button>
          <Button disabled={loading || isDrawingMode} variant="outlined" color="primary" size="small" onClick={handleAddRectangle}>
            Add Rectangle
          </Button>
          <Button disabled={loading || isDrawingMode} variant="outlined" color="primary" size="small" onClick={handleAddCircle}>
            Add Circle
          </Button>
          <Button
            disabled={loading}
            variant="outlined"
            color="primary"
            size="small"
            onClick={toggleDrawingMode}
          >
            {isDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            disabled={loading || isDrawingMode}
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              fileInputRef.current.click();
            }}
          >
            Upload Watermark
          </Button>
        </div>
        {selectedObject && (
          <Box className="flex items-center gap-2">
            <FormControl size="small" margin='none' variant="outlined">
              <input
                type="color"
                value={getSelectedColor()}
                onChange={handleColorChange}
                style={{ marginLeft: '10px' }}
              />
            </FormControl>
            <DeleteButton mode='light' text="Remove" size="small" onClick={handleRemove} />
          </Box>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <CustomButton
            disabled={isSubmitting || loading}
            loading={isSubmitting}
            variant="contained"
            color="primary"
            type="submit"
            onClick={(e) => {
              handleSave();
            }}
          >
            Save
          </CustomButton>
          <Button disabled={loading} variant="contained" color="primary" size="small" onClick={handleDownload}>
            Download
          </Button>
        </div>
      </div>

      <div>
        {loading ? 'Loading editor ...' : null}
      </div>

      <div className='custom-canvas'>
        <canvas style={{display: 'block'}} ref={canvasRef} />
      </div>
    </Box>
  );
};

export default ViewImage;
