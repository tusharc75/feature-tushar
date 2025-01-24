import { MenuItem, Popper } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
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
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
};

const Mention = forwardRef(
  (
    { editor, mentionInitialPosition, setMentionInitialPosition, channelData, numberOfMentions, selectedIndex, setSelectedIndex }: MentionProps,
    ref
  ) => {
    const initialRender = useRef(true);
    const text = mentionInitialPosition.node?.querySelector(`span#mention-${numberOfMentions}`)?.innerHTML;
    const searchVal = text;

    const filteredUser = useMemo(() => {
      if (searchVal === '') {
        return channelData?.members;
      }
      return channelData?.members.filter((d) => d.optionLabel.toLowerCase().includes(searchVal?.substring(1, searchVal.length).trim().toLowerCase()));
    }, [searchVal, channelData]);

    const newSelectedIndex = useMemo(() => {
      if (selectedIndex > filteredUser.length - 1) {
        setSelectedIndex(filteredUser.length - 1);
        return filteredUser.length - 1;
      }
      return selectedIndex;
    }, [selectedIndex, filteredUser.length, setSelectedIndex]);

    const handleClose = useCallback(() => setMentionInitialPosition(null), [setMentionInitialPosition]);

    useEffect(() => {
      if (!searchVal && !initialRender.current) {
        handleClose();
      }
      setSelectedIndex(0);
      initialRender.current = false;
    }, [searchVal, handleClose, setSelectedIndex]);

    const handleInsert = useCallback(
      (d: ChannelData['members'][number]) => {
        const htmlContent = `<span class="mention"><a href='${routes.userDetail.path}/${d.optionValue}' className="link" target="_blank" rel="noreferrer"><span contenteditable="false">@${d.optionLabel}</span></a></span>&nbsp;`;
        editor.dom.get(`mention-${numberOfMentions}`)?.remove();
        editor.execCommand('mceInsertContent', false, htmlContent);
        editor.focus();
        handleClose();
      },
      [editor, handleClose, numberOfMentions]
    );

    const applySelected = useCallback(() => {
      handleInsert(filteredUser[newSelectedIndex]);
    }, [filteredUser, handleInsert, newSelectedIndex]);

    useImperativeHandle(ref, () => {
      return {
        applySelected,
        handleClose
      };
    }, [applySelected, handleClose]);

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
        <div className="max-h-[250px] overflow-auto rounded-md bg-[var(--dark-primary,white)] shadow-md">
          {filteredUser.map((d, index) => {
            return (
              <MenuItem selected={index === newSelectedIndex} button onClick={() => handleInsert(d)} key={d.optionValue}>
                {d.optionLabel}
              </MenuItem>
            );
          })}
        </div>
      </Popper>
    );
  }
);

export default Mention;
