import { useEffect } from 'react';
import { fabric } from 'fabric';

const CustomText = ({ canvas, textState, setTextState }) => {
    useEffect(() => {
        if (!canvas) return;

        const fabricText = new fabric.Textbox(textState.text, {
            left: textState.x,
            top: textState.y,
            fontSize: textState.fontSize,
            fill: textState.fill,
            width: textState.width,
            height: textState.height,
            editable: false
        });

        canvas.add(fabricText);

        // Listen for object modification
        fabricText.on('modified', () => {
            const updatedTexts = canvas.getObjects('textbox').map(textbox => ({
                id: textbox.id, // Ensure you have an id property on your text objects
                text: textbox.text,
                x: textbox.left,
                y: textbox.top,
                fontSize: textbox.fontSize,
                fill: textbox.fill,
                width: textbox.width,
                height: textbox.height,
            }));
            setTextState(updatedTexts);
        });

        return () => canvas.remove(fabricText);
    }, [canvas, textState, setTextState]);

    return null;
};

export default CustomText;
