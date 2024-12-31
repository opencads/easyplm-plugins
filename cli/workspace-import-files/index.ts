import { args, setLoggerPath } from '../.tsc/context';
import { Json } from '../.tsc/TidyHPC/LiteJson/Json';
import { DocumentInterface, IImportInput, IImportOutput } from './interfaces';
import { apis } from '../.tsc/Cangjie/TypeSharp/System/apis';
import { WebMessage } from '../IRawJson';
import { GetCadVersionOutput } from '../GetCadVersion';
import { ExportAllInput, ExportAllOutput } from '../ExportAll';
import { ImportInterface } from '../ImportInterface';
import { axios } from '../.tsc/Cangjie/TypeSharp/System/axios';
import { Path } from '../.tsc/System/IO/Path';
import { File } from '../.tsc/System/IO/File';
import { UTF8Encoding } from '../.tsc/System/Text/UTF8Encoding';
import { fileUtils } from '../.tsc/Cangjie/TypeSharp/System/fileUtils';

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
                rawJson: string | null;
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

let main = async () => {
    let inputPath = parameters.i ?? parameters.input;
    let outputPath = parameters.o ?? parameters.output;
    let loggerPath = parameters.l ?? parameters.logger;
    let progresserPath = parameters.p ?? parameters.progress ?? parameters.progresser;
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
    // 先将入参的文件都获取RawJson
    let exportAllInput = {
        Inputs: []
    } as ExportAllInput;
    let contentMD5s = input.Items.map(item => {
        return {
            contentMD5: fileUtils.md5(item.FilePath),
            filePath: item.FilePath
        };
    });
    let cacheRawJsons = await getRawJsonByContentMD5s(contentMD5s.map(item => item.contentMD5));
    let unCachedFilePaths = [] as string[];
    for (let item of contentMD5s) {
        let cachedRawJson = cacheRawJsons.find(x => x.contentMD5 == item.contentMD5);
        if (cachedRawJson == undefined) {
            throw "Failed to get raw json";
        }
        if (cachedRawJson.rawJson == null) {
            unCachedFilePaths.push(item.filePath);
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
        exportAllOutput = await exportAll(exportAllInput);
    }
    // 开始构建导入数据
    let importInput = [] as ImportInterface[];
    let defaultDirectory = await getDefaultDirectory();
    let documents = [...exportAllOutput.Documents];
    for (let item of cacheRawJsons) {
        if (item.rawJson) {
            documents.push(JSON.parse(item.rawJson));
        }
    }
    for (let document of documents) {
        let importItem = {} as ImportInterface;
        importItem.filePath = document.FilePath;
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
        importItem.rawJson = document;
        importInput.push(importItem);
    }

    let importResult = await importDocuments(importInput);
    let importOutput = [] as IImportOutput[];
    for (let item of importResult) {
        importOutput.push({
            ...item,
            rawJson: (importInput.find(item => item.displayName == item.displayName) ?? {})
        });
    }
    File.WriteAllText(outputPath, JSON.stringify(importOutput), utf8);
};

await main();
