import { DateTime } from "../.tsc/System/DateTime";
import { Guid } from "../.tsc/System/Guid";


export interface IWorkspaceGetDocumentsInput {
    path: string,
    remoteWorkspaceId: string
}

export interface IDocumentRecord {
    name: string;
    fileName: string;
    number: string;
    partNumber: string;
    remoteState: 'new' | 'checkedIn' | 'checkedOut'|'unknown';
    remoteLastModifiedTime: string;
    lifeCycle: string;
    local: {
        workspaceState: 'untracked' | 'modified' | 'archived' | 'missing';
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
    };
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
}

export interface DocumentInterface {
    id: Guid,
    key: string,
    originFileName: string,
    formatFileName: string,
    lowerFormatFileName: string,
    contentMD5: string,
    rawJsonMD5: string,
    documentNumber0: string,
    documentNumber1: string,
    documentNumber2: string,
    partNumber0: string,
    partNumber1: string,
    partNumber2: string,
    documentRemoteID: string,
    partRemoteID: string,
    displayName: string,
    createTime: DateTime,
}
export interface DocumentWithRawJsonInterface extends DocumentInterface {
    rawJson: any
}

export interface ScanResult {
    untrackedFiles: string[],
    documents: DocumentWithRawJsonInterface[],
    modifiedDocuments: DocumentWithRawJsonInterface[],
    missingDocuments: DocumentWithRawJsonInterface[],
}
