import { RawJson } from "./IRawJson"

export interface ExportAllInput {
    Inputs: {
        FilePath:string,
        Properties: {
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
    }[],//文件路径
    
}

export interface ExportAllOutput extends RawJson {

}