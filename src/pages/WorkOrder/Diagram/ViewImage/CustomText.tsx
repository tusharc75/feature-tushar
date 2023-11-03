import React from 'react';
import { Transformer, Text } from 'react-konva';
import type { TextConfig } from 'konva/lib/shapes/Text';

interface CustomTextProps extends TextConfig {}

const CustomText: React.FC<CustomTextProps> = ({ textState, setTextState, selectedId, onSelect, onEdit, editingTextRef, ...otherProps }) => {
  const textRef = React.useRef(null);
  const trRef = React.useRef(null);

  const handleDrag = (e) => {
    setTextState((state) => {
      return state.map((s) => {
        if (s.id === textState.id) {
          return {
            ...s,
            isDragging: false,
            x: e.target.x(),
            y: e.target.y()
          };
        }
        return s;
      });
    });
  };

  React.useEffect(() => {
    if (selectedId) {
      trRef.current?.nodes([textRef.current]);
      trRef.current?.getLayer().batchDraw();
    }
  }, [selectedId]);

  const onDblClickText = () => {
    textRef.current.hide();
    trRef.current.hide();
    editingTextRef.current = { textRef: textRef.current, transformRef: trRef.current };
    onEdit();
  };

  return (
    <>
      <Text
        {...otherProps}
        id={'canvasText'}
        ref={textRef}
        wrap="wrap"
        width={textState.width}
        fontSize={16}
        onTap={onSelect}
        onClick={onSelect}
        onDblClick={onDblClickText}
        align="center"
        text={textState.text}
        draggable
        height={textState.height}
        x={textState.x}
        y={textState.y}
        onDragStart={() => {
          setTextState((state) => {
            return state.map((s) => ({ ...s, isDragging: s.id === textState.id }));
          });
        }}
        onDragEnd={handleDrag}
        onTransformEnd={(e) => {
          const node = textRef.current;
          const scaleX = node?.scaleX();
          const scaleY = node?.scaleY();

          // we will reset it back
          node?.scaleX(1);
          node?.scaleY(1);
          setTextState((state) => {
            return state.map((s) => {
              if (s.id === textState.id) {
                return {
                  ...s,
                  x: node?.x(),
                  y: node?.y(),
                  // set minimal value
                  width: Math.max(5, node?.width() * scaleX),
                  height: Math.max(node?.height() * scaleY)
                };
              }
              return s;
            });
          });
        }}
      />

      {selectedId && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default CustomText;
