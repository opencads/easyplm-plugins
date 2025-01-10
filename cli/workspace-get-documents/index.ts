import { UTF8Encoding } from "../.tsc/System/Text/UTF8Encoding";
import { apis, args, setLoggerPath } from "../.tsc/context";
import { RawJsonDocument, WebMessage } from "../IRawJson";
import { Json } from "../.tsc/TidyHPC/LiteJson/Json";
import { DocumentInterface, IWorkspaceGetDocumentsInput, QueryDocumentsByIndexInput, ScanResult } from "./interfaces";
import { axios } from "../.tsc/Cangjie/TypeSharp/System/axios";
import { Path } from "../.tsc/System/IO/Path";
import { fileUtils } from "../.tsc/Cangjie/TypeSharp/System/fileUtils";
import { taskUtils } from "../.tsc/Cangjie/TypeSharp/System/taskUtils";
import { Regex } from "../.tsc/System/Text/RegularExpressions/Regex";
import { IDocumentRecord, IProgresser } from "../interfaces";
import { Guid } from "../.tsc/System/Guid";
import { DateTime } from "../.tsc/System/DateTime";
import { Directory } from "../.tsc/System/IO/Directory";
let utf8 = new UTF8Encoding(false);
let parameters = {} as { [key: string]: string };
for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg.startsWith("--")) {
        let key = arg.substring(2);
        let value = args[i + 1];
        parameters[key] = value;
        i++;
    }
    else if (arg.startsWith("-")) {
        let key = arg.substring(1);
        let value = args[i + 1];
        parameters[key] = value;
        i++;
    }
}
console.log(parameters);

let Progresser = (progressPath: string, start: number, length: number) => {
    return {} as IProgresser;
};
Progresser = (progressPath: string, start: number, length: number) => {
    let current = start;
    let recordByPercent = (item: {
        parentID?: string,
        id?: string,
        percent: number,
        message?: string,
        status?: 'todo' | 'doing' | 'success' | 'failed',
        data?: any
    }) => {
        current = start + length * item.percent;
        fileUtils.writeLineWithShare(progressPath, `${Guid.NewGuid().ToString()} ${JSON.stringify({
            dateTime: DateTime.Now.ToString("O"),
            progress: current,
            ...item
        }, null, 0)}`);
    };
    let recordByIncrease = (item: {
        parentID?: string,
        id?: string,
        increase: number,
        message?: string,
        status?: 'todo' | 'doing' | 'success' | 'failed',
        data?: any
    }) => {
        current += item.increase * length;
        fileUtils.writeLineWithShare(progressPath, `${Guid.NewGuid().ToString()} ${JSON.stringify({
            dateTime: DateTime.Now.ToString("O"),
            progress: current,
            ...item
        }, null, 0)}`);
    };
    let getSubProgresserByPercent = (percent: number) => {
        return Progresser(progressPath, current, length * percent);
    };
    return {
        recordByPercent,
        recordByIncrease,
        getSubProgresserByPercent
    };
};

let callPlugin = async (pluginName: string, input: any) => {
    let response = await apis.runAsync("run", {
        PluginName: pluginName,
        Input: input
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data.Output;
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getDocumentsByDirectory = async (directory: string) => {
    let response = await apis.runAsync("getDocumentsByDirectory", {
        directory
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data as DocumentInterface[];
        }
        else {
            console.log(msg);
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let scanDirectory = async (directory: string) => {
    let response = await apis.runAsync("scanDirectory", {
        directory
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data as ScanResult;
        }
        else {
            console.log(msg);
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getContent = async (contentMD5: string) => {
    let response = await apis.runAsync("getContent", {
        contentMD5
    });
    if (response.StatusCode == 200) {
        return response.Body as RawJsonDocument;
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getWorkspaceRemoteDocuments = async () => {
    let output = await callPlugin("workspace-get-remote-documents", {

    });
    return output.Documents as IDocumentRecord[];
};

let queryDocumentsByIndex = async (input: QueryDocumentsByIndexInput) => {
    let output = await callPlugin("query-documents-by-index", input);
    return output.Documents as IDocumentRecord[];
};
let digitFileExtensionReg = new Regex('\\.\\d+$');
let getFormatFileName = (filePath: string) => {
    return digitFileExtensionReg.Replace(Path.GetFileName(filePath), "");
};

let updateDocumentByRemoteDocument = (document: IDocumentRecord, remoteDocument: IDocumentRecord) => {
    if (document.number == '') {
        document.number = remoteDocument.number;
    }
    if (document.partNumber == '') {
        document.partNumber = remoteDocument.partNumber;
    }
};

let main = async () => {
    let inputPath = parameters.i ?? parameters.input;
    let outputPath = parameters.o ?? parameters.output;
    let loggerPath = parameters.l ?? parameters.logger;
    let progresserPath = parameters.p ?? parameters.progress ?? parameters.progresser;
    let progresser = Progresser(progresserPath, 0, 1);
    if (inputPath == undefined || inputPath == null) {
        throw "inputPath is required";
    }
    if (outputPath == undefined || outputPath == null) {
        throw "outputPath is required";
    }
    if (loggerPath == undefined || loggerPath == null) {
        throw "loggerPath is required";
    }
    let input = Json.Load(inputPath) as IWorkspaceGetDocumentsInput;
    let output = {} as any;
    setLoggerPath(loggerPath);
    let localDocuments = [] as IDocumentRecord[];
    let remoteDocuments = [] as IDocumentRecord[];
    // 0.2, "正在扫描本地图档"
    progresser.recordByPercent({
        percent: 0.2,
        message: "正在扫描本地图档"
    });
    let tasks1 = (async () => {
        let scanResult = {
            untrackedFiles: [],
            documents: [],
            modifiedDocuments: [],
            missingDocuments: []
        } as ScanResult;
        if (Directory.Exists(input.path)) {
            scanResult = await scanDirectory(input.path)
        }
        // 0.2, "已扫描完本地图档，正在比对线上图档"
        progresser.recordByIncrease({
            increase: 0.2,
            message: "已扫描完本地图档，正在比对线上图档"
        });
        let queryInput = {
            FileNames: [],
            DocumentNumbers: [],
            PartNumbers: []
        } as QueryDocumentsByIndexInput;
        for (let item of scanResult.untrackedFiles) {
            queryInput.FileNames.push(getFormatFileName(item));
        }
        for (let item of [...scanResult.missingDocuments, ...scanResult.modifiedDocuments, ...scanResult.documents]) {
            if (item.documentNumber0 != "") {
                queryInput.DocumentNumbers.push(item.documentNumber0);
            }
            else if (item.partNumber0 != "") {
                queryInput.PartNumbers.push(item.partNumber0);
            }
            else if (item.formatFileName != "") {
                queryInput.FileNames.push(item.formatFileName);
            }
        }
        let queryDocuments = await queryDocumentsByIndex(queryInput);
        // 0.2, "已比对完线上图档"
        progresser.recordByIncrease({
            increase: 0.2,
            message: "已比对完线上图档"
        });
        for (let untrackedFile of scanResult.untrackedFiles) {
            let document = {
                key: Path.GetFileName(untrackedFile),
                name: Path.GetFileName(untrackedFile),
                fileName: Path.GetFileName(untrackedFile),
                number: "",
                partNumber: "",
                remote: {
                    success: false,
                    remoteState: 'unknown',
                    remoteLastModifiedTime: "",
                    lifeCycle: "",
                    remoteAttributes: [],
                    remoteChildren: []
                },
                local: {
                    success: true,
                    workspaceState: "untracked",
                    localFilePath: untrackedFile,
                    localAttributes: [],
                    localChildren: [],
                    localLastModifiedTime: fileUtils.lastWriteTime(untrackedFile).ToString("O")
                },

            } as IDocumentRecord;
            let remoteDocument = queryDocuments.find(x => x.fileName == getFormatFileName(untrackedFile));
            if (remoteDocument) {
                document.remote = remoteDocument.remote;
                updateDocumentByRemoteDocument(document, remoteDocument);
            }
            localDocuments.push(document);
        }
        for (let scanDocument of scanResult.documents) {
            let rawJsonDocument = scanDocument.rawJsonDocument;
            let attributes = rawJsonDocument.Attributes ?? {};
            let attributeKeys = Object.keys(attributes);
            let children = rawJsonDocument.Children ?? [];
            let remoteDocument = queryDocuments.find(x => {
                if (scanDocument.formatFileName != "") {
                    if (x.fileName == scanDocument.formatFileName) {
                        return true;
                    }
                }
                if (scanDocument.documentNumber0 != "") {
                    if (x.number == scanDocument.documentNumber0) {
                        return true;
                    }
                }
                if (scanDocument.partNumber0 != "") {
                    if (x.partNumber == scanDocument.partNumber0) {
                        return true;
                    }
                }
                return false;
            });
            let localDocument = {
                key: scanDocument.originFileName,
                name: scanDocument.displayName,
                fileName: scanDocument.originFileName,
                number: scanDocument.documentNumber0,
                partNumber: scanDocument.partNumber0,
                remote: {
                    success: false,
                    remoteState: 'unknown',
                    remoteLastModifiedTime: '',
                    lifeCycle: '',
                    remoteAttributes: [],
                    remoteChildren: [],
                },
                local: {
                    success: true,
                    workspaceState: 'archived',
                    localFilePath: Path.Combine(input.path, scanDocument.originFileName),
                    localAttributes: attributeKeys.map(item => {
                        return {
                            key: item,
                            value: attributes[item],
                            type: 'string'
                        }
                    }),
                    localChildren: children.map(item => {
                        return {
                            fileName: item.FileName,
                            name: item.Name ?? item.FileName,
                            number: '',
                            partNumber: ''
                        }
                    }),
                    localLastModifiedTime: fileUtils.lastWriteTime(Path.Combine(input.path, scanDocument.originFileName)).ToString("O")
                }
            } as IDocumentRecord;
            if (remoteDocument) {
                localDocument.remote = remoteDocument.remote;
                updateDocumentByRemoteDocument(localDocument, remoteDocument);
            }
            localDocuments.push(localDocument);
        }
        for (let scanDocument of scanResult.missingDocuments) {
            let rawJsonDocument = scanDocument.rawJsonDocument;
            let attributes = rawJsonDocument.Attributes ?? {};
            let attributeKeys = Object.keys(attributes);
            let children = rawJsonDocument.Children ?? [];
            let remoteDocument = queryDocuments.find(x => {
                if (scanDocument.formatFileName != "") {
                    if (x.fileName == scanDocument.formatFileName) {
                        return true;
                    }
                }
                if (scanDocument.documentNumber0 != "") {
                    if (x.number == scanDocument.documentNumber0) {
                        return true;
                    }
                }
                if (scanDocument.partNumber0 != "") {
                    if (x.partNumber == scanDocument.partNumber0) {
                        return true;
                    }
                }
                return false;
            });
            let localDocument = {
                key: scanDocument.originFileName,
                name: scanDocument.displayName,
                fileName: scanDocument.originFileName,
                number: scanDocument.documentNumber0,
                partNumber: scanDocument.partNumber0,
                remote: {
                    success: false,
                    remoteState: 'unknown',
                    remoteLastModifiedTime: '',
                    lifeCycle: '',
                    remoteAttributes: [],
                    remoteChildren: [],
                },
                local: {
                    success: true,
                    workspaceState: 'missing',
                    localFilePath: Path.Combine(input.path, scanDocument.originFileName),
                    localAttributes: attributeKeys.map(item => {
                        return {
                            key: item,
                            value: attributes[item],
                            type: 'string'
                        }
                    }),
                    localChildren: children.map(item => {
                        return {
                            fileName: item.FileName,
                            name: item.Name ?? item.FileName,
                            number: '',
                            partNumber: ''
                        }
                    }),
                    localLastModifiedTime: fileUtils.lastWriteTime(Path.Combine(input.path, scanDocument.originFileName)).ToString("O")
                }
            } as IDocumentRecord;
            if (remoteDocument) {
                localDocument.remote = remoteDocument.remote;
                updateDocumentByRemoteDocument(localDocument, remoteDocument);
            }
            localDocuments.push(localDocument);
        }
        for (let scanDocument of scanResult.modifiedDocuments) {
            let rawJsonDocument = scanDocument.rawJsonDocument;
            let attributes = rawJsonDocument.Attributes ?? {};
            let attributeKeys = Object.keys(attributes);
            let children = rawJsonDocument.Children ?? [];
            let remoteDocument = queryDocuments.find(x => {
                if (scanDocument.formatFileName != "") {
                    if (x.fileName == scanDocument.formatFileName) {
                        return true;
                    }
                }
                if (scanDocument.documentNumber0 != "") {
                    if (x.number == scanDocument.documentNumber0) {
                        return true;
                    }
                }
                if (scanDocument.partNumber0 != "") {
                    if (x.partNumber == scanDocument.partNumber0) {
                        return true;
                    }
                }
                return false;
            });
            let localDocument = {
                key: scanDocument.originFileName,
                name: scanDocument.displayName,
                fileName: scanDocument.originFileName,
                number: scanDocument.documentNumber0,
                partNumber: scanDocument.partNumber0,
                remote: {
                    success: false,
                    remoteState: 'unknown',
                    remoteLastModifiedTime: '',
                    lifeCycle: '',
                    remoteAttributes: [],
                    remoteChildren: [],
                },
                local: {
                    success: true,
                    workspaceState: 'modified',
                    localFilePath: Path.Combine(input.path, scanDocument.originFileName),
                    localAttributes: attributeKeys.map(item => {
                        return {
                            key: item,
                            value: attributes[item],
                            type: 'string'
                        }
                    }),
                    localChildren: children.map(item => {
                        return {
                            fileName: item.FileName,
                            name: item.Name ?? item.FileName,
                            number: '',
                            partNumber: ''
                        }
                    }),
                    localLastModifiedTime: fileUtils.lastWriteTime(Path.Combine(input.path, scanDocument.originFileName)).ToString("O")
                }
            } as IDocumentRecord;
            if (remoteDocument) {
                localDocument.remote = remoteDocument.remote;
                updateDocumentByRemoteDocument(localDocument, remoteDocument);
            }
            localDocuments.push(localDocument);
        }
    })();
    let tasks2 = (async () => {
        try {
            remoteDocuments = await getWorkspaceRemoteDocuments();
        }
        catch {

        }
        // 0.2, "已获取系统工作区文档列表"
        progresser.recordByIncrease({
            increase: 0.2,
            message: "已获取系统工作区文档列表"
        });
    })();
    await taskUtils.whenAll([tasks1, tasks2]);
    // 0.9, "获取文档列表完成"
    progresser.recordByPercent({
        percent: 0.9,
        message: "获取文档列表完成"
    });
    let resultDocuments = [] as IDocumentRecord[];
    output.Documents = resultDocuments;
    let toQueryDocuments = [] as IDocumentRecord[];
    for (let document of localDocuments) {
        let remoteDocument = remoteDocuments.find(item => item.fileName == document.fileName);
        if (remoteDocument) {
            if (document.remote.success) {

            }
            else {
                document.remote = remoteDocument.remote;
                updateDocumentByRemoteDocument(document, remoteDocument);
            }

            remoteDocuments.splice(remoteDocuments.indexOf(remoteDocument), 1);
        }
        else {
            toQueryDocuments.push(document);
            document.remote.remoteState = 'new';
        }
        resultDocuments.push(document);
    }
    remoteDocuments.forEach(item => {
        resultDocuments.push(item);
    });
    // 1, "完成"
    progresser.recordByPercent({
        percent: 1,
        message: "完成"
    });
    (output as Json).Save(outputPath);
};

await main();
