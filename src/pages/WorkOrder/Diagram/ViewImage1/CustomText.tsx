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
            y: position.y
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

  return (
    <Rnd
      key={textState.id}
      position={{ x: textState.x, y: textState.y }}
      size={{ width: textState.width, height: textState.height }}
      onDrag={(e, d) => handleDrag(textState.id, d)}
      onResize={(e, direction, ref, delta, position) => handleResize(textState.id, direction, ref, delta, position)}
      style={{
        border: '1px solid blue',
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
