export interface GetCadVersionInput {
    Inputs: string[]
}

export interface GetCadVersionOutput {
    CadInfomations: {
        FileName: string,
        FilePath: string,
        RecommendedCad: {
            Name: string,
            MajorVersion: string,
            MinorVersion: string,
        }
    }[]
}