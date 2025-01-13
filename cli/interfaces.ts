/*
Description:
    该文件主要是描述easyplm中标准的接口，用于与插件进行交互。
*/

export interface IProgresser {
    recordByPercent: (item: {
        parentID?: string,
        id?: string,
        percent: number,
        message?: string,
        status?: 'todo' | 'doing' | 'success' | 'failed',
        data?: any
    }) => void;
    recordByIncrease: (item: {
        parentID?: string,
        id?: string,
        increase: number,
        message?: string,
        status?: 'todo' | 'doing' | 'success' | 'failed',
        data?: any
    }) => void;
    getSubProgresserByPercent: (percent: number) => IProgresser;
}

export type IDocumentRemoteState = 'new' | 'checkedIn' | 'checkedOut' | 'unknown';

export type IDocumentWorkspaceState = 'untracked' | 'modified' | 'archived' | 'missing' | 'todownload';

export interface IDocumentRecord {
    key: string,
    name?: string;
    fileName?: string;
    number?: string;
    partNumber?: string;
    remote?: {
        success: boolean;
        remoteState?: IDocumentRemoteState;
        remoteLastModifiedTime?: string;
        lifeCycle?: string;
        version?: string;
        remoteAttributes?: {
            key: string,
            value: string,
            type: string
        }[];
        remoteChildren?: {
            fileName: string,
            name: string,
            number: string,
            partNumber: string
        }[];
        raw?: any
    },
    local?: {
        success: boolean;
        workspaceState?: IDocumentWorkspaceState;
        localFilePath?: string;
        localAttributes?: {
            key: string,
            value: string,
            type: string
        }[];
        localChildren?: {
            fileName: string,
            name: string,
            number: string,
            partNumber: string
        }[];
        localLastModifiedTime?: string;
        raw?: any
    };
}