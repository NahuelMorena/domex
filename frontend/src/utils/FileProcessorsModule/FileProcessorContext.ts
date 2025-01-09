import { FileProcessor } from "./processors/FileProcessor";

export class FileProcessorContext {
    private processor: FileProcessor;

    constructor(processor: FileProcessor) {
        this.processor = processor;
    }

    async execute(file: File): Promise<string> {
        return this.processor.process(file);
    }
}