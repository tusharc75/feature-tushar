import { CloudUploadOutlined } from '@mui/icons-material';
import { useRef } from 'react';
import RippleButton from 'src/components/RippleButton';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';

const Mask = ({ imageEditor, hideMenu }: SubmenuItemProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <RippleButton className={subMenuButtonClassname} onClick={() => inputRef.current.click()}>
          <CloudUploadOutlined />
          <p className={subMenuHelperTextClassName}>Load Mask Image</p>
        </RippleButton>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          onChange={(e) => {
            const supportingFileAPI = !!(window.File && window.FileList && window.FileReader);
            if (!supportingFileAPI) {
              alert('This browser does not support file-api');
            }
            const file = e.target.files[0];
            if (file) {
              const imgUrl = URL.createObjectURL(file);
              // imageEditor.loadImageFromURL(imageEditor.toDataURL(), `filterImage-${Date.now()}`).then(function () {
              imageEditor.addImageObject(imgUrl).then(function (objectProps) {
                URL.revokeObjectURL(imgUrl);
              });
              e.target.value = null;
              // });
            }
          }}
        />
      </div>
      {/* <div className="flex list-none justify-center gap-3 ">
        <RippleButton className={cn(subMenuButtonClassname, 'flex gap-1 pr-1')}>
          <Check fontSize="small" className="!mx-0 !size-[16px]" />
          <p className={subMenuHelperTextClassName}>Apply</p>
        </RippleButton>
      </div> */}
    </>
  );
};

export default Mask;
