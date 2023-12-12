import { Box, Button } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from 'src/components/Loader';
import CustomText from './CustomText';
import CustomButton from 'src/components/Helpers/CustomButton';
import { b64toBlob } from 'src/constants/helpers';

type TextType = {
  fontSize: number;
  fill: string;
  text: string;
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isFixed: boolean;
};

const ViewImage = ({ data, fetchData, setSelectedAttachment }) => {
  const toastConfig = useContext(CustomToastContext);

  const [url, setUrl] = useState();
  const [widthHeight, setWidthHeight] = useState({
    width: 0,
    height: 0
  });
  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [editingText, setEditingText] = useState<TextType>(null);
  const editingTextRef = useRef(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/user/download?fileName=' + data?.url, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const imageType = 'image/jpeg'; //'image/png'
        const file = new Blob([data], { type: imageType });
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
          let base64data: any = reader.result;
          setUrl(base64data);
          setTexts([]);
          getImageScale(base64data);
        };
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [data]);

  const getImageScale = (base64: string) => {
    const image = new Image();
    image.src = base64;
    image.onload = function () {
      scaleToFit(this);
    };
    function scaleToFit(img) {
      setWidthHeight({
        width: img.width,
        height: img.height
      });
      setLoading(false);
    }
  };

  const handleAddText = () => {
    const defaultTextConfig = { fontSize: 16, fill: 'black', text: '', id: 1, x: 50, y: 80, width: 100, height: 20, isFixed: true };
    setTexts((state) => {
      return [...state, { ...defaultTextConfig, id: texts?.length + 1, text: `New Text - ${state.length + 1}` }];
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    const mimeType = `image/${data?.url?.split('.')[1]}`;

    const base64Image = await axiosInstance().post('/attachment/update-image', {
      texts: texts.filter((text) => text.isFixed),
      mimeType,
      base64: url
    });

    const blob: any = b64toBlob(base64Image.data.data);

    const file: any = new File([blob], data?.name, { type: mimeType });
    let formData = new FormData();
    formData.append('file', file);
    const res: any = await axiosInstance().post('/user/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    axiosInstance()
      .put(`/attachment/replace/${data?.attachmentId}`, { oldUrl: data?.url, url: res.data.fileName })
      .then(({ data }) => {
        setTexts([]);
        setSelectedAttachment(null);
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  return !loading ? (
    <div>
      <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button size="small" variant="outlined" color="primary" onClick={handleAddText}>
            Add Text
          </Button>
          <Box ml={1} />
          {selectedText && !editingText && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                setTexts((state) => state.filter((s) => s.id !== selectedText.id));
                if (selectedText) setSelectedText(null);
                if (editingText) setEditingText(null);
                if (!editingTextRef) {
                  editingTextRef.current.textRef.style.display = 'block';
                  editingTextRef.current = null;
                }
              }}
            >
              Remove Text
            </Button>
          )}
          <Box ml={1} />
          {selectedText && !editingText && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                setTexts((state) => {
                  return state.map((s) => {
                    if (s.id === selectedText.id) {
                      return { ...s, fill: s.fill === 'black' ? 'white' : 'black' };
                    }
                    return s;
                  });
                });
              }}
            >
              Change Color
            </Button>
          )}
        </Box>
        {texts?.length > 0 && (
          <CustomButton
            disabled={isSubmitting}
            loading={isSubmitting}
            variant="contained"
            color="primary"
            type="submit"
            onClick={(e) => {
              handleSave();
            }}
          >
            Save
          </CustomButton>
        )}
      </Box>
      <Box height="calc(100vh - 115px)" style={{ overflow: 'hidden', position: 'relative', overflowX: 'auto', overflowY: 'auto' }}>
        <img src={url} alt="image" />
        <div style={{ width: widthHeight.width, height: widthHeight.height, position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
          {texts.map((text: any) => (
            <CustomText
              key={text.id}
              textState={text}
              setTextState={setTexts}
              onEdit={() => setEditingText(text)}
              editingTextRef={editingTextRef}
              onSelect={() => {
                setSelectedText(text);
              }}
            />
          ))}
          {editingText && (
            <textarea
              autoFocus
              aria-multiline
              ref={inputRef}
              style={{
                position: 'absolute',
                top: editingText.y,
                left: editingText.x,
                // width: editingText.width,
                overflow: 'hidden',
                outline: 'none',
                border: '1px solid black',
                margin: 0,
                padding: 0,
                fontSize: editingText.fontSize,
                background: 'none',
                color: editingText.fill,
              }}
              onKeyDown={(e) => {
                if (e?.keyCode === 13) {
                  setTexts((state) =>
                    state.map((s) => ({
                      ...s,
                      text: editingText.id === s.id ? editingText.text : s.text,
                      isFixed: editingText.id === s.id ? true : s.isFixed
                    }))
                  );
                  setEditingText(null);
                  editingTextRef.current.textRef.style.display = 'block';
                  editingTextRef.current = null;
                }
              }}
              value={editingText.text}
              onChange={(e) => {
                const val = e.target.value;
                setEditingText((pState) => ({ ...pState, text: val }));
              }}
            />
          )}
        </div>
      </Box>
    </div>
  ) : (
    <Loader style={{ minHeight: 500 }} text="Loading..." />
  );
};

export default ViewImage;
