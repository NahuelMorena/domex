import { FileProcessor } from "./FileProcessor";

export class TXTProcessor extends FileProcessor {
    async process(file: File): Promise<string> {
        return await file.text();
    }
}