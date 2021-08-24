import { csvIcon, docIcon, textFileIcon, pdfFileIcon, pptIcon, excelSheetIcon } from "../../../assets/file_icons/index";

export const fileIcons = [
    {
        extensions: [".txt", ".rtf"],
        source: textFileIcon
    },
    {
        extensions: [".doc", ".docx", ".docs"],
        source: docIcon
    },
    {
        extensions: [".pdf"],
        source: pdfFileIcon
    },
    {
        extensions: [".xlsx", ".xml", ".xls", ".xlsm", ".xlt", ".xltm", ".xltx", ".xlw"],
        source: excelSheetIcon
    },
    {
        extensions: [".csv"],
        source: csvIcon
    },
    {
        extensions: [".pot", ".potm", ".potx", ".ppa", ".ppam", ".pptx", ".pptm", ".ppt", ".ppsx"],
        source: pptIcon
    },
    {
        extensions: ["application/pdf"],
        source: pdfFileIcon
    },
    {
        extensions: ["application/vnd.oasis.opendocument.spreadsheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ],
        source: excelSheetIcon
    }
]
