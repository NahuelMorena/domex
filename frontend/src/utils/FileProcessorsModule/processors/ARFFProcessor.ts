import { FileProcessor } from "./FileProcessor";

export class ARFFProcessor extends FileProcessor {
    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const content = reader.result as string;
                    const lines = content.split('\n');
    
                    let attributes: string[] = [];
                    let data: any[] = [];
                    let isDataSection = false;
    
                    lines.forEach(line => {
                        const trimmedLine = line.trim();
    
                        if (trimmedLine.startsWith('%') || trimmedLine === '') {
                            return;
                        }
    
                        if (trimmedLine.startsWith('@attribute')) {
                            const attributeName = trimmedLine.split(' ')[1];
                            attributes.push(attributeName);
                        }
    
                        if (trimmedLine.startsWith('@data')) {
                            isDataSection = true;
                            return;
                        }
    
                        if (isDataSection && trimmedLine) {
                            const row = trimmedLine.split(',').map(value => value.trim().replace(/^['"]|['"]$/g, ''));
                            data.push(row);
                        }
                    });
    
                    const resultObject = {
                        attributes: attributes,
                        data: data
                    };
                    const plainText = resultObject.data.map(row => row.join(' ')).join('\n');
                    resolve(plainText);
                } catch (error: unknown) {
                    this.handleError(error, reject, 'Error al procesar ARFF');
                }
            };
    
            reader.onerror = (error) => this.handleError(error, reject, 'Error al leer archivo ARFF');
            reader.readAsText(file);
        });
    }
}