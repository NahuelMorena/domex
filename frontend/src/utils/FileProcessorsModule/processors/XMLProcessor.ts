import { FileProcessor } from "./FileProcessor";

export class XMLProcessor extends FileProcessor {
    private rows: string[][] = [];
    private headers: Set<string> = new Set();
    private maxDepth: number = 10;
    private currentDepth: number = 0;

    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            this.resetState();

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

    private resetState(): void {
        this.rows = [];
        this.headers = new Set();
        this.currentDepth = 0;
    }

    private processData(element: Element, context: {path: string[], values: string[]} = {path: [], values: []}): void {
        if (this.currentDepth > this.maxDepth) {
            throw new Error(`Profundidad máxima de recursión (${this.maxDepth}) excedida`);
        }
        
        this.currentDepth++;
        
        try {
            const localContext = {
                path: [...context.path],
                values: [...context.values]
            };

            Array.from(element.attributes).forEach(attr => {
                localContext.values.push(attr.value);
                this.headers.add(attr.name);
            });

            let hasNestedData = false;
            Array.from(element.children).forEach(child => {
                if (child.children.length > 0) {
                    hasNestedData = true;
                    this.processData(child, localContext);
                } else {
                    const value = child.textContent?.trim();
                    if (value) {
                        localContext.values.push(value);
                        this.headers.add(child.tagName);
                    }
                }
            });
            
            if (!hasNestedData && localContext.values.length > 0) {
                this.rows.push(localContext.values);
            }
        } finally {
            this.currentDepth--;
        }
    }
}