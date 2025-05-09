import {
  ArrowForwardIosSharp,
  ArrowRightAltSharp,
  ChatBubbleOutlineOutlined,
  CircleOutlined,
  EastSharp,
  FavoriteBorderOutlined,
  HorizontalRuleSharp,
  LocationOnOutlined
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { IoIosStarOutline } from 'react-icons/io';
import { LuOctagon } from 'react-icons/lu';
import RippleButton from 'src/components/RippleButton';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import ColorPicker from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/ColorPicker';
import { scalePath } from 'src/pages/WorkOrder/Diagram/ImageEditor/utils';

const shapeMap = {
  // arrow
  arrow1: {
    icon: <EastSharp />,
    path: scalePath('m15 5-1.41 1.41L18.17 11H2v2h16.17l-4.59 4.59L15 19l7-7z', 8, 8),
    label: 'Arrow',
    name: 'arrow1'
  },
  arrow2: {
    icon: <ArrowRightAltSharp />,
    path: scalePath('M16.01 11H4v2h12.01v3L20 12l-3.99-4z', 8, 8),
    label: 'Arrow-2',
    name: 'arrow2'
  },
  arrow3: {
    icon: <ArrowForwardIosSharp />,
    path: scalePath('M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z', 5, 5),
    label: 'Arrow-3',
    name: 'arrow3'
  },
  horizontalLine: {
    icon: <HorizontalRuleSharp />,
    path: scalePath('M4 11h16v2H4z', 8, 8),
    label: 'Line',
    name: 'horizontalLine'
  },
  // star
  star: {
    icon: <IoIosStarOutline />,
    path: scalePath('M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', 5, 5),
    label: 'Star',
    name: 'star'
  },
  customPolygon: {
    icon: <LuOctagon />,
    path: scalePath('M15.936 2.50098L21.501 8.06595V15.936L15.936 21.501H8.06595L2.50098 15.936V8.06595L8.06595 2.50098H15.936Z', 5, 5),
    label: 'Polygon',
    name: 'customPolygon'
  },
  circle: {
    icon: <CircleOutlined />,
    path: scalePath('M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2', 5, 5),
    label: 'Circle',
    name: 'circle'
  },
  // shapes
  location: {
    icon: <LocationOnOutlined />,
    path: scalePath(
      'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5',
      5,
      5
    ),
    label: 'Location',
    name: 'location'
  },
  heart: {
    icon: <FavoriteBorderOutlined />,
    path: scalePath(
      'm12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z',
      5,
      5
    ),
    label: 'Heart',
    name: 'heart'
  },
  customChatBubble: {
    icon: <ChatBubbleOutlineOutlined />,
    path: scalePath('M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2', 10, 10),
    label: 'Bubble',
    name: 'customChatBubble'
  }
} as const;

const shapeList = [
  shapeMap['arrow1'],
  shapeMap['arrow2'],
  shapeMap['arrow3'],
  shapeMap['horizontalLine'],
  shapeMap['star'],
  shapeMap['customPolygon'],
  shapeMap['circle'],
  shapeMap['location'],
  shapeMap['heart'],
  shapeMap['customChatBubble']
];

type ShapeMap = typeof shapeMap;
type ShapeMapKeys = keyof ShapeMap;
type ShapeRegisterData = { [key in ShapeMapKeys]: string };

type StateValue = {
  position: { top: number; left: number } | null;
  shape: ShapeMap[ShapeMapKeys] | null;
  color: string;
};

const IconSubmenu = ({ hideMenu, imageEditor }: SubmenuItemProps) => {
  const [data, setData] = useState<StateValue>({ position: null, shape: null, color: '#000000' });
  const isListenerAttached = useRef(false);
  const isShapeSelected = useRef(false);

  useEffect(() => {
    const iconData = Object.keys(shapeMap).reduce((acc: ShapeRegisterData, curr: ShapeMapKeys) => {
      acc[curr] = shapeMap[curr].path;
      return acc;
    }, {} as ShapeRegisterData);
    imageEditor.registerIcons(iconData);
  }, [imageEditor]);

  useEffect(() => {
    if (!isListenerAttached.current) {
      imageEditor.on('mousedown', function (e, originPointer, ...rest) {
        if (isShapeSelected.current) {
          setData((prev) => ({ ...prev, position: { left: originPointer.x, top: originPointer.y } }));
        } else {
          setData((prev) => ({ ...prev, position: null }));
        }
      });
      isListenerAttached.current = true;
    }
  }, [imageEditor]);

  useEffect(() => {
    if (data.position && data.shape) {
      imageEditor.addIcon(data.shape.name, { fill: data.color, ...data.position }).then(() => {
        setData((prev) => ({ ...prev, position: null, shape: null }));
        isShapeSelected.current = false;
      });
    }
  }, [data, imageEditor]);

  return (
    <>
      <ul className=" mb-3 grid list-none grid-cols-3 justify-center gap-3 border-b pb-3">
        {shapeList.map((d) => (
          <li key={d.name}>
            <RippleButton
              className={subMenuButtonClassname}
              onClick={() => {
                setData((prev) => ({ ...prev, shape: d }));
                isShapeSelected.current = true;
              }}
              data-active={data.shape?.name === d.name}
            >
              {d.icon}
              <p className={subMenuHelperTextClassName}>{d.label}</p>
            </RippleButton>
          </li>
        ))}
      </ul>
      <div className="mb-3 flex items-center justify-center gap-2 border-b pb-3">
        <ColorPicker setColor={(color) => setData((prev) => ({ ...prev, color }))} color={data.color} label="Fill" />
      </div>
    </>
  );
};

export default IconSubmenu;
