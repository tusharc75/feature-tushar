import { MenuItem, Popper } from '@material-ui/core';
import { Editor } from '@tinymce/tinymce-react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import routes from 'src/components/Helpers/Routes';
import { ChannelData } from 'src/pages/WorkSpace/types';

type MentionInitialPosition = {
  node: HTMLElement;
  offsetIndex: number;
  clientWidth: number;
  clientHeight: number;
  getBoundingClientRect: () => DOMRect;
};

type MentionProps = {
  editor: Editor['editor'] | null;
  mentionInitialPosition: MentionInitialPosition;
  setMentionInitialPosition: React.Dispatch<React.SetStateAction<MentionInitialPosition>>;
  channelData: ChannelData;
  numberOfMentions: number;
};

const Mention = ({ editor, mentionInitialPosition, setMentionInitialPosition, channelData, numberOfMentions }: MentionProps) => {
  const initialRender = useRef(true);
  const text = mentionInitialPosition.node?.querySelector(`span#mention-${numberOfMentions}`)?.innerHTML;
  const searchVal = text;

  const filteredUser = useMemo(() => {
    if (searchVal === '') {
      return channelData?.members;
    }
    return channelData?.members.filter((d) => d.optionLabel.toLowerCase().includes(searchVal?.substring(1, searchVal.length).trim().toLowerCase()));
  }, [searchVal, channelData]);

  const handleClose = useCallback(() => setMentionInitialPosition(null), [setMentionInitialPosition]);

  useEffect(() => {
    if (!searchVal && !initialRender.current) {
      handleClose();
    }
    initialRender.current = false;
  }, [searchVal, handleClose]);

  const handleInsert = (d: ChannelData['members'][number]) => {
    const htmlContent = `<span class="mention"><a href='${routes.userDetail.path}/${d.optionValue}' className="link" target="_blank" rel="noreferrer"><span contenteditable="false">@${d.optionLabel}</span></a></span>&nbsp;`;
    editor.dom.get(`mention-${numberOfMentions}`)?.remove();
    editor.execCommand('mceInsertContent', false, htmlContent);
    editor.focus();
    handleClose();
  };

  return (
    <Popper
      open={true}
      placement="top-start"
      anchorEl={{
        clientHeight: mentionInitialPosition.clientHeight,
        clientWidth: mentionInitialPosition.clientWidth,
        getBoundingClientRect: mentionInitialPosition.getBoundingClientRect
      }}
    >
      <div className="max-h-[250px] rounded-md bg-[var(--dark-primary,white)] shadow-md">
        {filteredUser.map((d) => {
          return (
            <MenuItem button onClick={() => handleInsert(d)} key={d.optionValue}>
              {d.optionLabel}
            </MenuItem>
          );
        })}
      </div>
    </Popper>
  );
};

export default Mention;
