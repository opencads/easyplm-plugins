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

let Progresser = (progressPath: string, start: number, length: number, scope: string) => {
    return {} as IProgresser;
};
Progresser = (progressPath: string, start: number, length: number, scope: string) => {
    let current = start;
    let recordByPercent = (percent: number, message: string) => {
        current = start + length * percent;
        let id = Guid.NewGuid().ToString();
        fileUtils.writeLineWithShare(progressPath, `${id} ${JSON.stringify({ DateTime: DateTime.Now.ToString("O"), Scope: scope, Progress: current, Message: message }, null, 0)}`);
    };
    let recordByIncrease = (increase: number, message: string) => {
        current += increase * length;
        let id = Guid.NewGuid().ToString();
        fileUtils.writeLineWithShare(progressPath, `${id} ${JSON.stringify({ DateTime: DateTime.Now.ToString("O"), Scope: scope, Progress: current, Message: message }, null, 0)}`);
    };
    let recordByPercentWithData = (percent: number, message: string, data: any) => {
        current = start + length * percent;
        let id = Guid.NewGuid().ToString();
        fileUtils.writeLineWithShare(progressPath, `${id} ${JSON.stringify({ DateTime: DateTime.Now.ToString("O"), Scope: scope, Progress: current, Message: message, Data: data }, null, 0)}`);
    };
    let recordByIncreaseWithData = (increase: number, message: string, data: any) => {
        current += increase * length;
        let id = Guid.NewGuid().ToString();
        fileUtils.writeLineWithShare(progressPath, `${id} ${JSON.stringify({ DateTime: DateTime.Now.ToString("O"), Scope: scope, Progress: current, Message: message, Data: data }, null, 0)}`);
    };
    let getSubProgresserByPercent = (subScope: string, percent: number) => {
        return Progresser(progressPath, current, length * percent, subScope);
    };
    return {
        recordByPercent,
        recordByIncrease,
        recordByPercentWithData,
        recordByIncreaseWithData,
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
    let progresser = Progresser(progresserPath, 0, 1, "ImportFilesToWorkspace");
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
    let copyProgresser = progresser.getSubProgresserByPercent("ImportFilesToWorkspace.Copy", 0.1);
    let copyProgresserStep = 1.0 / input.Items.length;
    let toImportItems = [] as {
        sourceFilePath: string;
        targetFilePath: string;
        rawJson?: RawJson;
        contentMD5?: string;
    }[];
    for (let item of input.Items) {
        let itemPath = item.FilePath;
        let itemFormatDirectory = Path.GetDirectoryName(itemPath).replace('/', '\\');
        if (itemFormatDirectory != formatDefaultDirectory) {
            // 拷贝文件到默认目录，如果默认目录下文件已存在，则不拷贝
            let destinationPath = Path.Combine(defaultDirectory, Path.GetFileName(itemPath));
            if (File.Exists(destinationPath)) {
                copyProgresser.recordByIncreaseWithData(copyProgresserStep, `File '${Path.GetFileName(item.FilePath)}' copy failed, is existed in workspace`, {
                    FilePath: item.FilePath,
                    DestinationPath: destinationPath,
                    Status: 'failed'
                });
            }
            else {
                console.log(`itemFormatDirectory: ${itemFormatDirectory}`);
                if (itemFormatDirectory == "") {
                    console.log(`item.Agent: ${item.Agent}`);
                    if (item.Agent) {
                        copyProgresser.recordByIncreaseWithData(copyProgresserStep, `Saving '${Path.GetFileName(item.FilePath)}'`, {
                            FilePath: item.FilePath,
                            DestinationPath: destinationPath,
                            Status: 'doing'
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
                            copyProgresser.recordByIncreaseWithData(copyProgresserStep, `Save '${Path.GetFileName(item.FilePath)}' succeeded`, {
                                FilePath: item.FilePath,
                                DestinationPath: destinationPath,
                                Status: 'succeeded'
                            });
                        }
                        else {
                            copyProgresser.recordByIncreaseWithData(copyProgresserStep, `Save '${Path.GetFileName(item.FilePath)}' failed`, {
                                FilePath: item.FilePath,
                                DestinationPath: destinationPath,
                                Status: 'failed'
                            });
                        }

                    }
                    else {
                        copyProgresser.recordByIncreaseWithData(copyProgresserStep, `File '${Path.GetFileName(item.FilePath)}' save failed, unkown cad source`, {
                            FilePath: item.FilePath,
                            DestinationPath: destinationPath,
                            Status: 'failed'
                        });
                    }
                }
                else {
                    File.Copy(itemPath, destinationPath);
                    copyProgresser.recordByIncreaseWithData(copyProgresserStep, `File '${Path.GetFileName(item.FilePath)}' copy succeeded`, {
                        FilePath: item.FilePath,
                        DestinationPath: destinationPath,
                        Status: 'succeeded'
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
    progresser.recordByPercent(0.15, `Computing MD5 of files`);
    let toCacheRawJsons = [] as {
        contentMD5: string,
        rawJson: any
    }[];
    let toQueryRawJsonContentMD5s = [] as {
        contentMD5: string;
        filePath: string;
    }[];
    for (let item of toImportItems) {
        let contentMD5 = fileUtils.md5(item.sourceFilePath);
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
    progresser.recordByPercent(0.2, `Caching Raw BOM of ${toCacheRawJsons.length} files`);
    await cacheRawJson(toCacheRawJsons);
    // progresser.recordByPercent(0.3, `Cached`);
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
        progresser.recordByPercent(0.35, `Exporting Raw BOM of ${exportAllInput.Inputs.length} files`);
        exportAllOutput = await exportAll(exportAllInput);
        // progresser.recordByPercent(0.4, `Exported`);
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
        progresser.recordByPercent(0.45, `Caching Raw BOM of ${toCacheFilePaths.length} files`);
        await cacheRawJson(toCacheRawJsons);
    }
    // progresser.recordByPercent(0.5, `Cached`);
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
    progresser.recordByPercent(0.6, `Building import data of ${toImportItems.length} files`);
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
    // progresser.recordByPercent(0.7, `Built`);
    // 开始导入数据
    progresser.recordByPercent(0.8, `Importing ${importInput.length} files`);
    let importResult = await importDocuments(importInput);
    // progresser.recordByPercent(1, ``);
    let importOutput = [] as IImportOutput[];
    for (let item of importResult) {
        let importInputItem = importInput.find(x => x.displayName == item.displayName);
        if (importInputItem == undefined) {
            throw "Failed to find import input item";
        }
        importOutput.push({
            ...item,
            rawJsonDocument: importInputItem.rawJsonDocument
        });
    }
    File.WriteAllText(outputPath, JSON.stringify(importOutput), utf8);
};

await main();
