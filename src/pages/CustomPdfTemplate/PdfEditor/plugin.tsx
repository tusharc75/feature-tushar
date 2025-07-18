import { text, image, table, line } from '@pdfme/schemas';
import type { Plugin, Schema } from '@pdfme/common';
import { productTableName, serviceTableName, tableNameOption } from './optionhelper';
import RobotoRegular from '../../../assets/font/Roboto-Regular.ttf';
import RobotoBold from '../../../assets/font/Roboto-Bold.ttf';

type DesignerPluginSchema = Schema & {
    width: number;
    height: number;
    position: { x: number; y: number };
    type: string;
    name: string;
    bold?: boolean;
    fontName?: string;
};

type DesignerExpectedPlugin = Plugin<DesignerPluginSchema>;

export const getPlugins = (variables: string[]): Record<string, DesignerExpectedPlugin> => {

    const customTablePlugin = {
        ...table,
        propPanel: {
            ...table.propPanel,
            schema: (props) => {
                const baseSchema = typeof table.propPanel.schema === 'function'
                    ? table.propPanel.schema(props)
                    : { ...table.propPanel.schema };

                const selectedTableName = props.activeSchema.name;
                const headerOptions =
                    selectedTableName === 'productTable' ? productTableName : serviceTableName;

                baseSchema.name = {
                    title: 'Name',
                    type: 'string',
                    widget: 'select',
                    default: tableNameOption[0].label,
                    props: {
                        options: tableNameOption,
                    },
                };

                const schemaWithDropdowns: any = {
                    ...baseSchema,
                };

                const head = props.activeSchema.head || [];
                head.forEach((val: string, i: number) => {
                    schemaWithDropdowns[`head.${i}`] = {
                        title: `Header ${i + 1}`,
                        type: 'string',
                        widget: 'select',
                        default: val,
                        props: {
                            options: headerOptions,
                        },
                    };
                });

                return schemaWithDropdowns;
            },
            defaultSchema: table.propPanel.defaultSchema,
        },
    };

    const textDefault = text.propPanel.defaultSchema

    const variableDefaultSchema: DesignerPluginSchema = {
        width: 100,
        height: 10,
        position: { x: 0, y: 0 },
        type: 'Variable',
        name: '',
        content: textDefault.content,
        rotate: textDefault.rotate!,
        opacity: textDefault.opacity!,
        readOnly: textDefault.readOnly!,
        required: textDefault.required!,
        __bodyRange: textDefault.__bodyRange!,
        __isSplit: textDefault.__isSplit!,
    }

    const customVariablePlugin: any = {
        ...text,
        type: 'Variable',
        propPanel: {
            ...text.propPanel,
            defaultSchema: variableDefaultSchema,
            schema: props => {
                const base = typeof text.propPanel.schema === 'function'
                    ? text.propPanel.schema(props)
                    : { ...text.propPanel.schema }

                base.name = {
                    title: 'Name',
                    type: 'string',
                    widget: 'select',
                    props: { options: variables },
                };
                return base;
            },
        },
    };

    const customTextPlugin = {
        ...text,
        propPanel: {
            ...text.propPanel,
            defaultSchema: {
                ...text.propPanel.defaultSchema,
                fontName: 'Roboto',
                bold: false,
            } as DesignerPluginSchema,
            schema: (props) => {
                const baseSchema = typeof text.propPanel.schema === 'function'
                    ? text.propPanel.schema(props)
                    : { ...text.propPanel.schema };

                const activeTextSchema = props.activeSchema as DesignerPluginSchema;

                baseSchema.bold = {
                    title: 'Bold',
                    type: 'boolean',
                    default: false,
                };

                const isBold = activeTextSchema.bold;
                activeTextSchema.fontName = isBold ? 'Roboto-Bold' : 'Roboto';

                return baseSchema;
            },
        },
    };


    const plugins: Record<string, DesignerExpectedPlugin> = {
        Text: customTextPlugin as DesignerExpectedPlugin,
        Table: customTablePlugin as DesignerExpectedPlugin,
        Image: image as DesignerExpectedPlugin,
        Line: line as DesignerExpectedPlugin,
        Variable: customVariablePlugin as unknown as any,
    };

    return plugins;
};

export const getFonts = async () => {
    try {
        const [robotoRegularData, robotoBoldData] = await Promise.all([
            fetch(RobotoRegular).then(res => res.arrayBuffer()),
            fetch(RobotoBold).then(res => res.arrayBuffer())
        ]);

        return {
            Roboto: { data: robotoRegularData, fallback: true },
            'Roboto-Bold': { data: robotoBoldData },
        };
    } catch (error) {
        console.error('Error loading fonts:', error);
        return {};
    }
};