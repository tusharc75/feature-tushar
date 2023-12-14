import { useRef } from 'react';
import { Rnd } from 'react-rnd';

const CustomText = ({ textState, setTextState, onEdit, editingTextRef, onSelect }) => {
  const textRef = useRef(null);

  const handleDrag = (id, d) => {
    setTextState((prevTexts) => prevTexts.map((text) => (text.id === id ? { ...text, x: d.x, y: d.y } : text)));
  };

  const handleResize = (id, direction, ref, delta, position) => {
    setTextState((prevTexts) =>
      prevTexts.map((text) =>
        text.id === id
          ? {
            ...text,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            x: position.x,
            y: position.y,
            fontSize: calculateFontSize(ref.offsetWidth, ref.offsetHeight),
          }
          : text
      )
    );
  };

  const onDoubleClick = () => {
    textRef.current.style.display = 'none';
    editingTextRef.current = { textRef: textRef?.current };
    setTextState((prevTexts) =>
      prevTexts.map((text) =>
        text.id === textState.id
          ? {
            ...text,
            isFixed: false,
          }
          : text
      )
    );
    onEdit();
  };

  const calculateFontSize = (width, height) => {
    // Implement your logic to calculate font size based on width and height
    // Example: return Math.sqrt(parseInt(width) * parseInt(height)) / 10;
    return Math.min(parseInt(width), parseInt(height)) / 1.5; // Simple example
  };

  return (
    <Rnd
      key={textState.id}
      position={{ x: textState.x, y: textState.y }}
      size={{ width: textState.width, height: textState.height }}
      onDrag={(e, d) => handleDrag(textState.id, d)}
      onResize={(e, direction, ref, delta, position) => handleResize(textState.id, direction, ref, delta, position)}
      style={{
        border: '2px solid #007FFF',
      }}
      resizeHandleStyles={{
        topRight: { cursor: 'nesw-resize', position: 'absolute', width: '10px', height: '10px', right: '-5px', top: '-5px', backgroundColor: '#007FFF', borderRadius: '50%' },
        bottomRight: { cursor: 'nwse-resize', position: 'absolute', width: '10px', height: '10px', right: '-5px', bottom: '-5px', backgroundColor: '#007FFF', borderRadius: '50%' },
        bottomLeft: { cursor: 'nwsw-resize', position: 'absolute', width: '10px', height: '10px', left: '-5px', bottom: '-5px', backgroundColor: '#007FFF', borderRadius: '50%' },
        topLeft: { cursor: 'nwse-resize', position: 'absolute', width: '10px', height: '10px', left: '-5px', top: '-5px', backgroundColor: '#007FFF', borderRadius: '50%' }
      }}
    >
      <div
        ref={textRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          position: 'absolute'
        }}
        onDoubleClick={onDoubleClick}
        onClick={onSelect}
      >
        <span
          style={{
            fontSize: textState.fontSize,
            color: textState.fill,
            textAlign: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {textState.text}
        </span>
      </div>
    </Rnd>
  );
};

export default CustomText;
