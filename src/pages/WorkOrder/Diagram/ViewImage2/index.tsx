import React, { useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { b64toBlob } from 'src/constants/helpers';

const ViewImage = ({ data, fetchData, setSelectedAttachment }) => {
    const toastConfig = useContext(CustomToastContext);
    const [canvas, setCanvas] = useState(null);
    const canvasRef = useRef(null);
    const [dimension, setDimension] = useState({ height: 0, width: 0 })
    const [selectedText, setSelectedText] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Initialize the Fabric.js canvas
    useEffect(() => {
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            preserveObjectStacking: true,
        });
        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.cornerStyle = 'circle';


        setCanvas(fabricCanvas);
        loadImage(fabricCanvas);


        // fabricCanvas.on('selection:created', (e) => handleSelection(e));
        // fabricCanvas.on('selection:updated', (e) => handleSelection(e));
        // fabricCanvas.on('object:moving', () => {
        //     if (isEditing) {
        //         canvas.discardActiveObject();
        //         setIsEditing(false);
        //     }
        // });

        // Cleanup
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
                        setDimension({ height: img.height, width: img.width })
                        fabricCanvas.setDimensions({ width: img.width, height: img.height });
                        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
                    });
                };
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    // Function to add new text
    const handleAddText = () => {
        const id = new Date().getMilliseconds();
        const newText = new fabric.IText('New Text', {
            left: 50,
            top: 80,
            fontSize: 16,
            fill: 'black',
            width: 100,
            height: 20,
            myId: id,
            editable: true,
            // objecttype: 'text'
        });
        canvas.add(newText);
    };

    const handleSelection = (e) => {
        if (e.target.type === 'textbox') {
            setSelectedText(e.target);
            setIsEditing(true);
        }
    };


    // Save function (example)
    const handleSave = async () => {
        const canvasData = canvas.toJSON();
        const mimeType = `image/${data?.url?.split('.')[1]}`;

        const image = await axiosInstance().post('/attachment/update-image', {
            canvas: JSON.stringify(canvasData),
            fileName: data?.name,
            dimension: dimension
        });

        const blob: any = b64toBlob(image.data.data);
        const file: any = new File([blob], data?.name, { type: mimeType });
        let formData = new FormData();
        formData.append('file', file);
        const res: any = await axiosInstance().post('/user/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        await axiosInstance()
            .put(`/attachment/replace/${data?.attachmentId}`, { oldUrl: data?.url, url: res.data.fileName })
            .then(({ data }) => {
                setSelectedAttachment(null);
                fetchData();
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
        // Save canvasData to your backend or process as needed
    };

    return (
        <div>
            <button onClick={handleAddText}>Add Text</button>
            <button onClick={handleSave}>Save</button>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default ViewImage;
