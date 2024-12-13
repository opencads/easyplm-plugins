import { RawJson } from "../IRawJson"
export interface ExportAllInput {
    FilePath: string,
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

        },
        ExportJT?: {
            Enable: boolean,
        },
        ExportPDF?: {
            Enable: boolean,
        },
        ExportDwg?: {
            Enable: boolean,
        },
        ExportDxf?: {
            Enable: boolean,
        }
    },
}
export interface UpdateRawJsonInput {
    WriteRawJson: RawJson,
    ExportAllInputs: ExportAllInput[]
}

export interface IProgresser {
    recordByPercent: (percent: number, message: string) => void;
    recordByIncrease: (increase: number, message: string) => void;
    getSubProgresserByPercent: (subScope: string, percent: number) => IProgresser;
}