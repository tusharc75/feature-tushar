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
import { getIconPath, scalePath } from 'src/pages/WorkOrder/Diagram/ImageEditor/utils';

const shapeMap = {
  // arrow
  arrow1: {
    icon: <EastSharp />,
    path: scalePath('m15 5-1.41 1.41L18.17 11H2v2h16.17l-4.59 4.59L15 19l7-7z', 40, 40),
    label: 'Arrow',
    name: 'arrow1'
  },
  arrow2: {
    icon: <ArrowRightAltSharp />,
    path: scalePath('M16.01 11H4v2h12.01v3L20 12l-3.99-4z', 40, 40),
    label: 'Arrow-2',
    name: 'arrow2'
  },
  arrow3: {
    icon: <ArrowForwardIosSharp />,
    path: scalePath('M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z', 40, 40),
    label: 'Arrow-3',
    name: 'arrow3'
  },
  horizontalLine: {
    icon: <HorizontalRuleSharp />,
    path: scalePath('M4 11h16v2H4z', 40, 40),
    label: 'Line',
    name: 'horizontalLine'
  },
  // star
  star: {
    icon: <IoIosStarOutline />,
    path: 'M463 192H315.9L271.2 58.6C269 52.1 262.9 48 256 48s-13 4.1-15.2 10.6L196.1 192H48c-8.8 0-16 7.2-16 16 0 .9.1 1.9.3 2.7.2 3.5 1.8 7.4 6.7 11.3l120.9 85.2-46.4 134.9c-2.3 6.5 0 13.8 5.5 18 2.9 2.1 5.6 3.9 9 3.9 3.3 0 7.2-1.7 10-3.6l118-84.1 118 84.1c2.8 2 6.7 3.6 10 3.6 3.4 0 6.1-1.7 8.9-3.9 5.6-4.2 7.8-11.4 5.5-18L352 307.2l119.9-86 2.9-2.5c2.6-2.8 5.2-6.6 5.2-10.7 0-8.8-8.2-16-17-16zm-127.2 92.5c-10 7.2-14.2 20.2-10.2 31.8l30.1 87.7c1.3 3.7-2.9 6.8-6.1 4.6l-77.4-55.2c-4.9-3.5-10.6-5.2-16.3-5.2-5.7 0-11.4 1.7-16.2 5.2l-77.4 55.1c-3.2 2.3-7.4-.9-6.1-4.6l30.1-87.7c4-11.8-.2-24.8-10.3-32l-81-57.1c-3.2-2.2-1.6-7.3 2.3-7.3H196c12 0 22.7-7.7 26.5-19.1l29.6-88.2c1.2-3.6 6.4-3.6 7.6 0l29.6 88.2c3.8 11.4 14.5 19.1 26.5 19.1h97.3c3.9 0 5.5 5 2.3 7.2l-79.6 57.5z',
    label: 'Star',
    name: 'star'
  },
  customPolygon: {
    icon: <LuOctagon />,
    path: scalePath('M15.936 2.50098L21.501 8.06595V15.936L15.936 21.501H8.06595L2.50098 15.936V8.06595L8.06595 2.50098H15.936Z', 30, 30),
    label: 'Polygon',
    name: 'customPolygon'
  },
  circle: {
    icon: <CircleOutlined />,
    path: 'M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z',
    label: 'Circle',
    name: 'circle'
  },
  // shapes
  location: {
    icon: <LocationOnOutlined />,
    path: 'M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1 1 64-64 64.07 64.07 0 0 1-64 64z',
    label: 'Location',
    name: 'location'
  },
  heart: {
    icon: <FavoriteBorderOutlined />,
    path: 'M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z',
    label: 'Heart',
    name: 'heart'
  },
  customChatBubble: {
    icon: <ChatBubbleOutlineOutlined />,
    path: scalePath('M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2', 40, 40),
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
