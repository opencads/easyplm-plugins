/*
Description:
    该文件主要是描述xplm中标准的接口，用于与插件进行交互。
*/

export interface IProgresser {
    recordByPercent: (percent: number, message: string) => void;
    recordByPercentWithData: (percent: number, message: string, data: any) => void;
    recordByIncrease: (increase: number, message: string) => void;
    recordByIncreaseWithData: (increase: number, message: string, data: any) => void;
    getSubProgresserByPercent: (subScope: string, percent: number) => IProgresser;
}

export interface IDocumentRecord {
    key: string,
    name: string;
    fileName: string;
    number: string;
    partNumber: string;
    remote: {
        success: boolean;
        remoteState: 'new' | 'checkedIn' | 'checkedOut' | 'unknown';
        remoteLastModifiedTime: string;
        lifeCycle: string;
        remoteAttributes: {
            key: string,
            value: string,
            type: string
        }[];
        remoteChildren: {
            fileName: string,
            name: string,
            number: string,
            partNumber: string
        }[];
        raw?: any
    },
    local: {
        success: boolean;
        workspaceState: 'untracked' | 'modified' | 'archived' | 'missing' | 'todownload';
        localFilePath: string;
        localAttributes: {
            key: string,
            value: string,
            type: string
        }[];
        localChildren: {
            fileName: string,
            name: string,
            number: string,
            partNumber: string
        }[];
        localLastModifiedTime: string;
        raw?: any
    };
}