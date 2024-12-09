import { args, setLoggerPath } from '../.tsc/context';
import { Json } from '../.tsc/TidyHPC/LiteJson/Json';
import { IImportInput } from './interfaces';

let main = async () => {
    if (args.length < 4) {
        console.log("Usage: <inputPath> <outputPath> <loggerPath> <progresserPath>");
        return;
    }
    let inputPath = args[0];
    let outputPath = args[1];
    let loggerPath = args[2];
    let progresserPath = args[3];

    let input = Json.Load(inputPath) as IImportInput;
    let output = {} as any;
    setLoggerPath(loggerPath);

    
};

await main();