import { text, image, table, line, rectangle } from '@pdfme/schemas';
import type { Plugin, Schema, UIRenderProps, PDFRenderProps, Template } from '@pdfme/common';
import RobotoRegular from '../../../assets/font/Roboto-Regular.ttf';
import RobotoBold from '../../../assets/font/Roboto-Bold.ttf';
import myGridPlugin from './newcustomtable';

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

export const getPlugins = (variables: string[], resourceTables: any): Record<string, DesignerExpectedPlugin> => {

    const customTablePlugin = {
        ...table,
        propPanel: {
            ...table.propPanel,
            defaultSchema: {
                ...table.propPanel.defaultSchema,
                content: '[]',
                showHead: true,
                head: ['col1', 'col2', 'col3'],
                headWidthPercentages: [30, 30, 40],
            },
            schema: (props) => {
                const baseSchema =
                    typeof table.propPanel.schema === 'function'
                        ? table.propPanel.schema(props)
                        : { ...table.propPanel.schema };
                const selectedTableName = props.activeSchema.name;
                const headerOptions = resourceTables?.find((e) => e.value === selectedTableName)?.fields || [];
                const head = props.activeSchema.head || [];
                const schemaWithDropdowns: any = {
                    ...baseSchema,
                    name: {
                        title: 'Name',
                        type: 'string',
                        widget: 'select',
                        default: resourceTables?.length ? resourceTables[0].label : '',
                        props: {
                            options: resourceTables,
                        },
                    },
                    headStyles: {
                        type: 'object',
                        title: 'Head Styles',
                        properties: baseSchema.headStyles?.properties || {},
                        props: {
                            style: {
                                backgroundColor: '#ffffff',
                                marginBottom: '25px',
                            },
                        },
                    },
                    bodyStyles: {
                        type: 'object',
                        title: 'Body Styles',
                        properties: baseSchema.bodyStyles?.properties || {},
                        props: {
                            style: {
                                backgroundColor: '#ffffff',
                                marginBottom: '25px',
                            },
                        },
                    },
                    tableStyles: {
                        type: 'object',
                        title: 'Table Styles',
                        properties: baseSchema.tableStyles?.properties || {},
                        props: {
                            style: {
                                backgroundColor: '#ffffff',
                                marginBottom: '25px',
                            },
                        },
                    },
                    columnStyles: {
                        type: 'object',
                        title: 'Column Styles',
                        properties: baseSchema.columnStyles?.properties || {},
                        props: {
                            style: {
                                backgroundColor: '#ffffff',
                                marginBottom: '25px',
                            },
                        },
                    },
                };

                head.forEach((val: string, i: number) => {
                    schemaWithDropdowns[`head.${i}`] = {
                        title: `Header ${i + 1}`,
                        type: 'string',
                        widget: 'select',
                        default: val,
                        span: 24,
                        props: {
                            options: headerOptions,
                        },
                    };
                });

                return schemaWithDropdowns;
            },
        },
    };

    const textDefault = text.propPanel.defaultSchema

    const variableDefaultSchema: DesignerPluginSchema = {
        width: 80,
        height: 10,
        position: { x: 0, y: 0 },
        type: 'Variable',
        name: '',
        content: textDefault.content,
        rotate: textDefault.rotate!,
        opacity: textDefault.opacity!,
        readOnly: true,
        required: false,
        __bodyRange: textDefault.__bodyRange!,
        __isSplit: textDefault.__isSplit!,
    }

    const customVariablePlugin: any = {
        ...text,
        icon: '{𝐕𝐚𝐫}',
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
                readOnly: true,
                required: false,
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
        Variable: customVariablePlugin as unknown as DesignerExpectedPlugin,
        Table: customTablePlugin as unknown as DesignerExpectedPlugin,
        grid: myGridPlugin as unknown as DesignerExpectedPlugin,
        Image: image as DesignerExpectedPlugin,
        Line: line as DesignerExpectedPlugin,
        Rectangle: rectangle as DesignerExpectedPlugin,
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