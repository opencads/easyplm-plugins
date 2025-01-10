import { args, setLoggerPath, apis } from '../.tsc/context';
import { Json } from '../.tsc/TidyHPC/LiteJson/Json';
import { DocumentInterface, IImportInput, IImportOutput } from './interfaces';
import { Apis } from '../.tsc/Cangjie/TypeSharp/System/Apis';
import { Agent, RawJson, RawJsonDocument, WebMessage } from '../IRawJson';
import { GetCadVersionOutput } from '../GetCadVersion';
import { ExportAllInput, ExportAllOutput } from '../ExportAll';
import { ImportInterface } from '../ImportInterface';
import { axios } from '../.tsc/Cangjie/TypeSharp/System/axios';
import { Path } from '../.tsc/System/IO/Path';
import { File } from '../.tsc/System/IO/File';
import { UTF8Encoding } from '../.tsc/System/Text/UTF8Encoding';
import { fileUtils } from '../.tsc/Cangjie/TypeSharp/System/fileUtils';
import { IProgresser } from '../interfaces';
import { Guid } from '../.tsc/System/Guid';
import { DateTime } from '../.tsc/System/DateTime';
import { pathUtils } from "../.tsc/Cangjie/TypeSharp/System/pathUtils";

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

let exportAll = async (input: ExportAllInput) => {
    return await callPlugin("ExportAll", input) as ExportAllOutput;
};

let activeDocumentSaveAs = async (agent: Agent, outputPath: string) => {
    await callPlugin("ActiveDocument", {
        Option: "SaveAs",
        Data: outputPath,
        Agent: agent
    });
};

let getDefaultDirectory = async () => {
    let response = await apis.runAsync("getDefaultDirectory", {

    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data;
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getRawJsonByContentMD5s = async (contentMD5s: string[]) => {
    let response = await apis.runAsync("getRawJsonByContentMD5s", {
        contentMD5s
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data as {
                contentMD5: string;
                rawJson: RawJson | null;
            }[];
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let importDocuments = async (data: ImportInterface[]) => {
    let response = await apis.runAsync("import", {
        data: data
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data as DocumentInterface[];
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let cacheRawJson = async (items: {
    contentMD5: string;
    rawJson: string;
}[]) => {
    let response = await apis.runAsync("cacheRawJson", {
        items
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data;
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
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

    let input = Json.Load(inputPath) as IImportInput;
    setLoggerPath(loggerPath);
    // 第一步，将文件拷贝到本地工作区
    let defaultDirectory = await getDefaultDirectory();
    let formatDefaultDirectory = defaultDirectory.replace('/', '\\');
    let copyProgresser = progresser.getSubProgresserByPercent(0.3);
    let copyProgresserStep = 1.0 / input.Items.length;
    let toImportItems = [] as {
        sourceFilePath: string;
        targetFilePath: string;
        rawJson?: RawJson;
        contentMD5?: string;
    }[];
    // -- 找到目标目录不存在的文件
    let noTargetFilePaths = input.Items.map(item => {
        let itemPath = item.FilePath;
        return Path.Combine(defaultDirectory, Path.GetFileName(itemPath));
    }).filter(item => File.Exists(item) == false);
    console.log(`noTargetFilePaths = ${noTargetFilePaths}`);
    for (let item of input.Items) {
        let itemPath = item.FilePath;
        let itemFormatDirectory = Path.GetDirectoryName(itemPath).replace('/', '\\');
        if (itemFormatDirectory != formatDefaultDirectory) {
            // 拷贝文件到默认目录，如果默认目录下文件已存在，则不拷贝
            let destinationPath = Path.Combine(defaultDirectory, Path.GetFileName(itemPath));
            if (File.Exists(destinationPath)) {
                if (noTargetFilePaths.includes(destinationPath)) {
                    toImportItems.push({
                        sourceFilePath: itemPath,
                        targetFilePath: destinationPath,
                        rawJson: item.RawJson
                    });
                }
                else {
                    copyProgresser.recordByIncrease({
                        increase: copyProgresserStep,
                        message: `${Path.GetFileName(item.FilePath)} copy failed, is existed in workspace`,
                        status: 'failed',
                        data: {}
                    });
                }
            }
            else {
                if (itemFormatDirectory == "") {
                    console.log(`item.Agent: ${item.Agent}`);
                    if (item.Agent) {
                        let progressID = Guid.NewGuid().ToString();
                        // progressID, copyProgresserStep, `Save ${Path.GetFileName(item.FilePath)}`, 'doing', {}
                        copyProgresser.recordByIncrease({
                            id: progressID,
                            increase: copyProgresserStep,
                            message: `Save ${Path.GetFileName(item.FilePath)}`,
                            status: 'doing'
                        });
                        let saveAsSuccess = false;
                        try {
                            await activeDocumentSaveAs(item.Agent, destinationPath);
                            saveAsSuccess = true;
                        }
                        catch (e: any) {
                            console.log(e);
                        }
                        if (saveAsSuccess) {
                            toImportItems.push({
                                sourceFilePath: itemPath,
                                targetFilePath: destinationPath,
                                rawJson: item.RawJson
                            });
                            copyProgresser.recordByIncrease({
                                id: progressID,
                                increase: copyProgresserStep,
                                status: 'success'
                            });
                        }
                        else {
                            copyProgresser.recordByIncrease({
                                id: progressID,
                                increase: copyProgresserStep,
                                status: 'failed'
                            });
                            copyProgresser.recordByIncrease({
                                parentID: progressID,
                                increase: copyProgresserStep,
                                message: `${Path.GetFileName(item.FilePath)} save failed`,
                            });
                        }

                    }
                    else {
                        copyProgresser.recordByIncrease({
                            increase: copyProgresserStep,
                            message: `${Path.GetFileName(item.FilePath)} save failed, unkown cad source`,
                            status: 'failed'
                        });
                    }
                }
                else {
                    let progressID = Guid.NewGuid().ToString();
                    copyProgresser.recordByIncrease({
                        id: progressID,
                        increase: copyProgresserStep/2,
                        message: `Copy ${Path.GetFileName(item.FilePath)}`,
                        status: 'doing'
                    });
                    File.Copy(itemPath, destinationPath);
                    copyProgresser.recordByIncrease({
                        id: progressID,
                        increase: copyProgresserStep/2,
                        status: 'success'
                    });
                    toImportItems.push({
                        sourceFilePath: itemPath,
                        targetFilePath: destinationPath,
                        rawJson: item.RawJson
                    });
                }
            }
        }
        else {
            toImportItems.push({
                sourceFilePath: itemPath,
                targetFilePath: itemPath,
                rawJson: item.RawJson
            });
        }
    }
    // 第二步，缓存已知的RawJson，并获取需要查询的文件的ContentMD5
    let progressID_ComputeMD5 = Guid.NewGuid().ToString();
    progresser.recordByPercent({
        id: progressID_ComputeMD5,
        percent: 0.35,
        message: `Compute MD5 of files`,
        status: 'doing'
    });
    let toCacheRawJsons = [] as {
        contentMD5: string,
        rawJson: any
    }[];
    let toQueryRawJsonContentMD5s = [] as {
        contentMD5: string;
        filePath: string;
    }[];
    for (let item of toImportItems) {
        let contentMD5 = fileUtils.md5(item.targetFilePath);
        item.contentMD5 = contentMD5;
        if (item.rawJson) {
            toCacheRawJsons.push({
                contentMD5: contentMD5,
                rawJson: item.rawJson
            });
        }
        else {
            toQueryRawJsonContentMD5s.push({
                contentMD5: contentMD5,
                filePath: item.targetFilePath
            });
        }
    }
    progresser.recordByPercent({
        id: progressID_ComputeMD5,
        percent: 0.4,
        status: 'success'
    });
    let progressID_CacheRawJson = Guid.NewGuid().ToString();
    progresser.recordByPercent({
        id: progressID_CacheRawJson,
        percent: 0.45,
        message: `Cache Raw BOM of ${toCacheRawJsons.length} files`,
        status: 'doing'
    });
    await cacheRawJson(toCacheRawJsons);
    progresser.recordByPercent({
        id: progressID_CacheRawJson,
        percent: 0.5,
        status: 'success'
    });
    // 先将入参的文件(没有RawJson)都获取RawJson
    let exportAllInput = {
        Inputs: []
    } as ExportAllInput;
    let queriedCacheRawJsons = await getRawJsonByContentMD5s(toQueryRawJsonContentMD5s.map(item => item.contentMD5));
    let unCachedFilePaths = [] as string[];
    for (let item of toQueryRawJsonContentMD5s) {
        let cachedRawJson = queriedCacheRawJsons.find(x => x.contentMD5 == item.contentMD5);
        if (cachedRawJson == undefined) {
            throw "Failed to get raw json";
        }
        if (cachedRawJson.rawJson == null) {
            unCachedFilePaths.push(item.filePath);
        }
        else {
            // 补齐toImportItems的RawJson
            let importItem = toImportItems.find(x => x.targetFilePath == item.filePath);
            if (importItem == undefined) {
                throw "Failed to find import input item";
            }
            importItem.rawJson = cachedRawJson.rawJson;
        }
    }
    for (let item of unCachedFilePaths) {
        exportAllInput.Inputs.push({
            FilePath: item,
            Properties: {

            }
        });
    }
    let exportAllOutput = {
        DocInfo: {
            SchemaVersion: '3.2.0'
        },
        Documents: []
    } as ExportAllOutput;
    if (exportAllInput.Inputs.length != 0) {
        let progressID_ExportAll = Guid.NewGuid().ToString();
        progresser.recordByPercent({
            id: progressID_ExportAll,
            percent: 0.55,
            message: `Exporting Raw BOM of ${exportAllInput.Inputs.length} files`,
            status: 'doing'
        });
        try {
            exportAllOutput = await exportAll(exportAllInput);
        }
        catch {

        }
        progresser.recordByPercent({
            id: progressID_ExportAll,
            percent: 0.6,
            status: 'success'
        });
    }
    // 缓存导出的RawJson
    let mapFilePathToDocuments = {} as {
        [key: string]: RawJsonDocument[]
    };
    for (let document of exportAllOutput.Documents) {
        let filePath = pathUtils.format(document.FilePath);
        if (mapFilePathToDocuments[filePath] == undefined) {
            mapFilePathToDocuments[filePath] = [];
        }
        mapFilePathToDocuments[filePath].push(document);
    }
    toCacheRawJsons = [];
    let toCacheFilePaths = Object.keys(mapFilePathToDocuments);
    for (let filePath of toCacheFilePaths) {
        let contentMD5 = toImportItems.find(x => pathUtils.isEquals(x.targetFilePath, filePath))?.contentMD5;
        if (contentMD5 == undefined) {
            contentMD5 = fileUtils.md5(filePath);
        }
        let documents = mapFilePathToDocuments[filePath];
        toCacheRawJsons.push({
            contentMD5: fileUtils.md5(filePath),
            rawJson: {
                Documents: documents
            }
        });
    }
    if (toCacheRawJsons.length != 0) {
        // 0.45, `Caching Raw BOM of ${toCacheFilePaths.length} files`
        progresser.recordByPercent({
            id: progressID_CacheRawJson,
            percent: 0.65,
            message: `Cache Raw BOM of ${toCacheFilePaths.length} files`,
            status: 'doing'
        });
        await cacheRawJson(toCacheRawJsons);
        progresser.recordByPercent({
            id: progressID_CacheRawJson,
            percent: 0.7,
            status: 'success'
        });
    }
    // 补齐toImportItems的RawJson
    for (let document of exportAllOutput.Documents) {
        let importItem = toImportItems.find(x => x.targetFilePath == document.FilePath);
        if (importItem == undefined) {
            throw "Failed to find import input item";
        }
        if (importItem.rawJson == undefined) {
            importItem.rawJson = {
                Documents: [document]
            } as any;
        }
        else {
            importItem.rawJson.Documents.push(document);
        }
    }
    // 开始构建导入数据
    // 0.6, `Building import data of ${toImportItems.length} files`
    let progressID_BuildImportData = Guid.NewGuid().ToString();
    progresser.recordByPercent({
        id: progressID_BuildImportData,
        percent: 0.75,
        message: `Build import data of ${toImportItems.length} files`,
        status: 'doing'
    });
    let importInput = [] as ImportInterface[];
    for (let toImportItem of toImportItems) {

        if (toImportItem.rawJson == undefined) {
            let importItem = {} as ImportInterface;
            importItem.filePath = toImportItem.targetFilePath;
            importItem.directory = defaultDirectory;
            importItem.displayName = Path.GetFileName(toImportItem.targetFilePath);
            importItem.documentNumber0 = "";
            importItem.documentNumber1 = "";
            importItem.documentNumber2 = "";
            importItem.partNumber0 = "";
            importItem.partNumber1 = "";
            importItem.partNumber2 = "";
            importItem.documentRemoteID = "";
            importItem.partRemoteID = "";
            // importItem.rawJson = document;
            importInput.push(importItem);
        }
        else {
            for (let document of toImportItem.rawJson.Documents) {
                let importItem = {} as ImportInterface;
                importItem.filePath = toImportItem.targetFilePath;
                importItem.directory = defaultDirectory;
                importItem.displayName = document.FileName;
                importItem.documentNumber0 = "";
                importItem.documentNumber1 = "";
                importItem.documentNumber2 = "";
                importItem.partNumber0 = "";
                importItem.partNumber1 = "";
                importItem.partNumber2 = "";
                importItem.documentRemoteID = "";
                importItem.partRemoteID = "";
                importItem.rawJsonDocument = document;
                importInput.push(importItem);
            }
        }
    }
    progresser.recordByPercent({
        id: progressID_BuildImportData,
        percent: 0.8,
        status: 'success'
    });
    // 开始导入数据
    let progressID_ImportData = Guid.NewGuid().ToString();
    progresser.recordByPercent({
        id: progressID_ImportData,
        percent: 0.85,
        message: `Import ${importInput.length} files`,
        status: 'doing'
    });
    let importResult = await importDocuments(importInput);
    progresser.recordByPercent({
        id: progressID_ImportData,
        percent: 0.9,
        status: 'success'
    });
    let importOutput = [] as IImportOutput[];
    for (let item of importResult) {
        let importInputItem = importInput.find(x => x.displayName == item.displayName);
        if (importInputItem == undefined) {
            throw "Failed to find import input item";
        }
        importOutput.push({
            ...item,
            rawJsonDocument: importInputItem.rawJsonDocument,
            filePath: importInputItem.filePath ?? ""
        });
    }
    File.WriteAllText(outputPath, JSON.stringify(importOutput), utf8);
};

await main();
