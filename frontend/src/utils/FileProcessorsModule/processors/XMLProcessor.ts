import { FileProcessor } from "./FileProcessor";

export class XMLProcessor extends FileProcessor {
    private rows: string[][] = [];
    private headers: string[] = [];
    
    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(reader.result as string, "application/xml");
    
                    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                        throw new Error("Error al parsear el XML");
                    }
    
                    this.processData(xmlDoc.documentElement);
                    resolve(this.formatRows(this.rows, this.calculateColumnWidth(this.rows)));
                } catch (error: unknown) {
                    this.handleError(error, reject, 'Error al procesar XML');
                }
            };
            reader.onerror = (error) => this.handleError(error, reject, 'Error al leer archivo XML');
            reader.readAsText(file);
        });
    }

    private processData(element: Element, context: string[] = []): void {
        const currentRow: string[] = [...context];
    
        Array.from(element.attributes).forEach(attr => {
            this.headers.push(attr.value);
            currentRow.push(attr.value);
        });
    
        Array.from(element.children).forEach(child => {
            if (child.children.length > 0) {
                if (currentRow.length > 0){
                    this.headers.push(currentRow[currentRow.length - 1]);
                }
                this.processData(child, currentRow);
            } else {
                const value = child.textContent?.trim();
                if (value) currentRow.push(value);
            }
        });
    
        if (currentRow.some(item => !this.headers.includes(item))) {
            this.rows.push([...currentRow]);
        }
    }
}