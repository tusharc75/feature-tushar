import { text, image, table ,line} from '@pdfme/schemas'; 
import type { Plugin, Schema } from '@pdfme/common';

type DesignerPluginSchema = Schema & {
    width: number;
    height: number;
    position: { x: number; y: number; };
    type: string;
    name: string;
};

type DesignerExpectedPlugin = Plugin<DesignerPluginSchema>;

export const getPlugins = () => {
    const plugins: Record<string, DesignerExpectedPlugin> = {
        Text: text as DesignerExpectedPlugin,
        Image: image as DesignerExpectedPlugin,
        Table: table as DesignerExpectedPlugin, 
        Line : line as DesignerExpectedPlugin
    };
    return plugins;
};