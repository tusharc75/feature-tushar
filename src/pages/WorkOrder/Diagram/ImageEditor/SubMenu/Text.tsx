import { FormatAlignCenter, FormatAlignLeft, FormatAlignRight, FormatBold, FormatItalic, FormatUnderlined } from '@mui/icons-material';
import { memo, useEffect, useRef, useState } from 'react';
import RippleButton from 'src/components/RippleButton';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import ColorPicker from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/ColorPicker';
import RangeInput from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/RangeInput';

type Data = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  fontSize: number;
};

const minFontSize = 10,
  maxFontSize = 100;

const Text = memo(({ hideMenu, imageEditor }: SubmenuItemProps) => {
  const [data, setData] = useState<Data>({ color: '#000000', bold: false, italic: false, textAlign: 'left', underline: false, fontSize: 60 });
  const [activeObjectId] = useEditorStore((state) => state.activeObjectId);
  const [newTextPosition] = useEditorStore((state) => state.newTextPosition);
  const initialRender = useRef(true);

  const changeCurrentTextStyle = (styleObj: tuiImageEditor.ITextStyleConfig) => {
    if (initialRender.current || !activeObjectId) return;
    imageEditor.changeTextStyle(activeObjectId, styleObj);
  };

  useEffect(() => {
    if (initialRender.current && !newTextPosition) {
      initialRender.current = false;
      return;
    }
    imageEditor.addText('Double Click', {
      position: newTextPosition,
      styles: {
        fill: data.color,
        fontSize: data.fontSize,
        fontStyle: data.italic ? 'italic' : 'normal',
        fontWeight: data.bold ? 'bold' : '',
        textAlign: data.textAlign,
        underline: data.underline,
        textDecoration: 'none'
      } as any
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTextPosition]);

  return (
    <>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                changeCurrentTextStyle({ fontWeight: prev.bold ? 'normal' : 'bold' });
                return { ...prev, bold: !prev.bold };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.bold}
          >
            <FormatBold />
            <p className={subMenuHelperTextClassName}>Bold</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                changeCurrentTextStyle({ fontStyle: prev.italic ? 'normal' : 'italic' });
                return { ...prev, italic: !prev.italic };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.italic}
          >
            <FormatItalic />
            <p className={subMenuHelperTextClassName}>Italic</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                changeCurrentTextStyle({ underline: !data.underline } as any);
                return { ...prev, underline: !prev.underline };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.underline}
          >
            <FormatUnderlined />
            <p className={subMenuHelperTextClassName}>Underline</p>
          </RippleButton>
        </li>
      </ul>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                changeCurrentTextStyle({ textAlign: 'left' });
                return { ...prev, textAlign: 'left' };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.textAlign === 'left'}
          >
            <FormatAlignLeft />
            <p className={subMenuHelperTextClassName}>Left</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                changeCurrentTextStyle({ textAlign: 'center' });
                return { ...prev, textAlign: 'center' };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.textAlign === 'center'}
          >
            <FormatAlignCenter />
            <p className={subMenuHelperTextClassName}>Center</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                changeCurrentTextStyle({ textAlign: 'right' });
                return { ...prev, textAlign: 'right' };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.textAlign === 'right'}
          >
            <FormatAlignRight />
            <p className={subMenuHelperTextClassName}>Right</p>
          </RippleButton>
        </li>
      </ul>
      <div className="mb-3 border-b pb-3">
        <ColorPicker
          color={data.color}
          setColor={(color) =>
            setData((prev) => {
              changeCurrentTextStyle({ fill: color });
              return { ...prev, color };
            })
          }
          label="Text Color"
        />
      </div>
      <div className="mb-3 border-b pb-3">
        <RangeInput
          min={minFontSize}
          max={maxFontSize}
          label="Text Size"
          onChange={(fontSize) =>
            setData((prev) => {
              changeCurrentTextStyle({ fontSize });
              return { ...prev, fontSize };
            })
          }
          value={data.fontSize}
        />
      </div>
    </>
  );
});

export default Text;
