import { FileProcessor } from "./FileProcessor";

export class JSONProcessor extends FileProcessor {
    private rows: string[][] = [];
    private headers: string[] = [];

    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result as string);
                    this.processData(data);
                    resolve(this.formatRows(this.rows, this.calculateColumnWidth(this.rows)))
                } catch (error: unknown) {
                    this.handleError(error, reject, 'Error al procesar JSON');
                }
            };
            reader.onerror = (error) => this.handleError(error, reject, 'Error al leer archivo JSON');
            reader.readAsText(file);
          });
    }

    private processData(item: any, context: string[] = []): void {
        if (Array.isArray(item)) {
            item.forEach(subItem => this.processData(subItem, context));
        } else if (typeof item === 'object' && item !== null) {
            let localContext: string[] = [...context];
            for (const [key, value] of Object.entries(item)) {
                if (Array.isArray(value)) {
                    this.headers.push(...localContext);
                    value.forEach(subItem => this.processData(subItem, [...localContext]));
                } else if (typeof value === 'object' && value !== null) {
                    this.processData(value, [...localContext, key]);
                } else {
                    localContext.push(String(value));
                }
            }
            if (localContext.some(item => !this.headers.includes(item))) {
                this.rows.push(localContext);
            }
        } else {
            this.rows.push([...context, String(item)]);
        }
    }
}