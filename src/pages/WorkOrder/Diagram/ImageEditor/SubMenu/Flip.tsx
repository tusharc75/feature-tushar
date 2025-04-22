import { History } from '@mui/icons-material';
import { CgEditFlipH, CgEditFlipV } from 'react-icons/cg';
import RippleButton from 'src/components/RippleButton';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';

const Flip = ({ hideMenu, imageEditor }: SubmenuItemProps) => {
  return (
    <>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton onClick={() => imageEditor.flipX()} className={subMenuButtonClassname}>
            <CgEditFlipH />
            <p className={subMenuHelperTextClassName}>Flip X</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton onClick={() => imageEditor.flipY()} className={subMenuButtonClassname}>
            <CgEditFlipV />
            <p className={subMenuHelperTextClassName}>Flip Y</p>
          </RippleButton>
        </li>
      </ul>
      <RippleButton onClick={() => imageEditor.resetFlip()} className={subMenuButtonClassname}>
        <History />
        <p className={subMenuHelperTextClassName}>Reset</p>
      </RippleButton>
    </>
  );
};

export default Flip;
