# Export All
Export All是一个用于导出文件的工具，支持导出多种文件格式，包括：Step、Stl、JT、PDF、Dwg、Dxf。
``` bat
ExportAll.exe -i {InputPath} -o {OutputPath} -l {LoggerPath} -s {Server}
```

- -i : 输入文件路径
``` ts
export interface Input {
    Inputs: string[],//文件路径
    Properties: {
        ExportRawJson?: {
            Enable: boolean,
            SchemeVersion:'1.0.0'
        },//单独打开
        ExportStep?: {
            Enable: boolean,
            Protocol: 'AP203' | 'AP214' | 'AP242',
            AP203Setting?: {
            },
            AP214Setting?: {
            },
            AP242Setting?: {
            }
        },
        ExportStl?: {
            Enable: boolean,
        },//单独打开
        ExportJT?: {
            Enable: boolean,
        },//单独打开
        ExportPDF?: {
            Enable: boolean,
        },//肯定需要完全打开，//先用浏览器来看
        ExportDwg?: {
            Enable: boolean,
        },//肯定需要完全打开，//
        ExportDxf?: {
            Enable: boolean,
        }//肯定需要完全打开，//
    },
}
```
- -o : 输出文件路径
``` ts
export interface Output {
    DocInfo: {
        SchemaVersion: "2.0.0", // 根据版本解析内容。每个版本都生成schema，用于校验数据。
        Author: string,
        CreateTime: string
    },
    Documents: [
        {
            FileName: string,
            FilePath: string,
            //文档属性，BOM属性
            Attributes: { [key: string]: string },
            //文档特性
            Properties: {
                [key: string]: any,
                Agent: 'ZWCad'|'AutoCad'|'NX'|'Creo'|'Solidworks'|'Catia'|'GStarCad'|'Inventor'|'Mentor'|'Cadence'|'Altium',
                PDFPaths?: string[],//绝对路径
                StepPaths?: string[],
                StlPaths?: string[],
                JTPaths?: string[],
                DwgPaths?: string[],
                DxfPaths?: string[]
            },
            Children:{
                FileName: string,
                FilePath: string,
                //文档属性，BOM属性
                ComponentAttributes: { [key: string]: string },
                //文档特性
                ComponentProperties: {
                    [key: string]: any,
                    Matrix: string[16],//列主序
                },
            }[]
        }
    ]
}
```
- -l : 日志文件路径

- -s : 服务器地址