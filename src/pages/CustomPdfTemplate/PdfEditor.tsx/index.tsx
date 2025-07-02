import React, { useEffect, useRef, useState } from 'react';
import { Designer } from '@pdfme/ui';
import type { Template } from '@pdfme/common';
import { CUSTOM_A4_PDF } from '@pdfme/common';
import { getPlugins } from './plugin';

interface PdfEditorProps {
    template?: any;
    onTemplateChange?: (tpl: Template) => void;
}


const PdfEditor = ({ template, onTemplateChange }: PdfEditorProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const designerInstanceRef = useRef<Designer | null>(null);

  

    useEffect(() => {
        if (!containerRef.current) return;

        if (!designerInstanceRef.current) {
            designerInstanceRef.current = new Designer({
                domContainer: containerRef.current,
                template: template,
                options: {
                    zoomLevel: 1,
                    sidebarOpen: true
                },
                plugins: getPlugins()
            });

            designerInstanceRef.current.onChangeTemplate((newTemplate) => {
                // setTemplate(newTemplate);
                if (onTemplateChange) {
                    onTemplateChange(newTemplate);
                }
            });
        }

        return () => {
            if (designerInstanceRef.current) {
                designerInstanceRef.current.destroy();
                designerInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default PdfEditor;