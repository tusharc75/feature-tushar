import { memo, useEffect, useState } from 'react';
import RecorderClass, { RecordedData } from './RecorderClass';
import { IconButton } from '@mui/material';
import { Mic, MicNoneOutlined } from '@mui/icons-material';
import { cn } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type RecorderProps = {
  onRecordFinish: (data: RecordedData) => void;
};

const Recorder = memo(({ onRecordFinish }: RecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorderInstance, setRecorderInstance] = useState<RecorderClass | null>(null);
  const [timeElapsed, setTimeElapsed] = useState('00:00');

  useEffect(() => {
    const recorderInstance = new RecorderClass({
      onStartRecording: () => {
        setIsRecording(true);
      },
      onStopRecording: (data) => {
        onRecordFinish(data);
        setIsRecording(false);
      },
      onTimeElapse: (time) => setTimeElapsed(time)
    });
    setRecorderInstance(recorderInstance);
    return () => {
      recorderInstance.destroy();
    };
  }, [onRecordFinish]);

  return (
    <div className="relative">
      <HtmlTooltip title={isRecording ? 'Relese to end recording' : 'Press and Hold to record'} placement="top" arrow>
        <IconButton
          size="small"
          color="primary"
          onMouseDown={recorderInstance?.startRecording}
          onMouseUp={recorderInstance?.stopRecording}
          onMouseLeave={() => {
            if (isRecording) {
              recorderInstance?.stopRecording();
            }
          }}
        >
          <Mic fontSize="small" />
        </IconButton>
      </HtmlTooltip>
      <div
        className={cn(
          'absolute bottom-0 left-full top-0 z-10 ml-2 flex h-full items-center gap-2 overflow-hidden transition-all duration-300',
          isRecording ? 'w-[80px]' : 'w-0'
        )}
      >
        <div className="flex h-full w-full items-center justify-between rounded-lg border p-2">
          <span className="animate-pulse">
            <MicNoneOutlined fontSize="small" color="error" />
          </span>
          <span className="mr-1 text-xs">{timeElapsed}</span>
        </div>
      </div>
    </div>
  );
});

export default Recorder;
