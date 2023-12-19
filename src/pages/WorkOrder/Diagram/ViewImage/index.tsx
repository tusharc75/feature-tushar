import { useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { b64toBlob } from 'src/constants/helpers';
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import { capitalize } from 'lodash';
import DeleteButton from 'src/components/Helpers/DeleteButton';

fabric.IText.prototype.initHiddenTextarea = (function (initHiddenTextarea) {
    return function () {
        var result = initHiddenTextarea.apply(this);
        fabric.document.body.removeChild(this.hiddenTextarea);
        this.canvas.wrapperEl.appendChild(this.hiddenTextarea);
        return result;
    };
})(fabric.IText.prototype.initHiddenTextarea);


const COLOR_LIST = ['black', 'red', 'green', 'yellow', 'blue']

const ViewImage = ({ data, fetchData, setSelectedAttachment }) => {

    const toastConfig = useContext(CustomToastContext);
    const [canvas, setCanvas] = useState(null);
    const canvasRef = useRef(null);
    const [isSubmitting, setSubmitting] = useState(false);

    const [selectedObject, setSelectedObject] = useState(null);

    useEffect(() => {
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            preserveObjectStacking: true,
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
                    });
                };
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleAddText = () => {
        const id = new Date().getMilliseconds();
        const newText = new fabric.IText('New Text', {
            left: 100,
            top: 100,
            fill: 'black',
            id: id,
            editable: true,
        });
        canvas.add(newText);
    };

    const handleAddLine = () => {
        const id = new Date().getMilliseconds();
        const newLine = new fabric.Line([50, 100, 200, 200], {
            left: 100,
            top: 100,
            stroke: 'black',
            id: id,
        });
        canvas.add(newLine);
    };

    const handleRemove = () => {
        canvas.remove(selectedObject);
    }

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
    }

    const onObjectSelected = (obj) => {
        if (obj.selected && obj.selected?.length) {
            setSelectedObject(obj.selected[0])
        }
        else {
            setSelectedObject(null)
        }
    }

    return (
        <Box>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={'flex gap-2 w-full'}>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={handleAddText}
                    >
                        Add Text
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={handleAddLine}
                    >
                        Add Line
                    </Button>
                    {selectedObject &&
                        <Box>
                            <FormControl size="small" variant="outlined" style={{ width: 120 }} >
                                <InputLabel margin="dense" id="demo-simple-select-outlined-label">Color</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    margin="dense"
                                    label="Color"
                                    value={canvas.getActiveObject().get('type') === 'line' ? canvas.getActiveObject().get("stroke") :
                                        canvas.getActiveObject().get("fill")}
                                    name="color"
                                    onChange={(event: any) => {
                                        if (canvas.getActiveObject().get('type') === 'line') {
                                            canvas.getActiveObject().set("stroke", event.target.value);
                                        }
                                        else {
                                            canvas.getActiveObject().set("fill", event.target.value);
                                        }
                                        canvas.renderAll();
                                    }}
                                >
                                    {COLOR_LIST.map((color, index) => (
                                        <MenuItem key={index} value={color}>
                                            {capitalize(color)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <DeleteButton text="Remove" size='small' onClick={handleRemove} />
                        </Box>
                    }
                </div>
                <div className="flex flex-wrap gap-[8px]  justify-end">
                    <CustomButton
                        disabled={isSubmitting}
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
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleDownload}
                    >
                        Download
                    </Button>
                </div>
            </div>
            <canvas ref={canvasRef} />
        </Box>
    );
};

export default ViewImage;
