import { FileProcessor } from "./FileProcessor";

export class JSONProcessor extends FileProcessor {
    private rows: string[][] = [];
    private headers: Set<string> = new Set();
    private maxDepth: number = 10;
    private currentDepth: number = 0;

    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            this.resetState();

            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result as string);
                    this.processData(data);

                    if (this.rows.length === 0 && data !== null) {
                        throw new Error("El JSON no contiene datos procesables");
                    }

                    resolve(this.formatRows(this.rows, this.calculateColumnWidth(this.rows)))
                } catch (error: unknown) {
                    this.handleError(error, reject, 'Error al procesar JSON');
                }
            };
            reader.onerror = (error) => this.handleError(error, reject, 'Error al leer archivo JSON');
            reader.readAsText(file);
          });
    }

    private resetState(): void {
        this.rows = [];
        this.headers = new Set();
        this.currentDepth = 0;
    }


    private processData(item: any, context: {path: string[], values: string[]} = {path: [], values: []}): void {
        if (this.currentDepth > this.maxDepth) {
            throw new Error(`Profundidad máxima de recursión (${this.maxDepth}) excedida`);
        }
        
        this.currentDepth++;
        
        try {
            if (Array.isArray(item)) {
                if (item.length === 0) return;

                if (item.some( i => typeof i !== 'object')) {
                    this.processPrimitiveArray(item, context);
                    return;
                }

                item.forEach(subItem => this.processData(subItem, context));
            } else if (typeof item == 'object' && item !== null) {
                const localContext = {
                    path: [...context.path],
                    values: [...context.values]
                };

                let hasNestedData = false;

                for (const [key, value] of Object.entries(item)) {
                    const fullPath = [...localContext.path, key];

                    if (Array.isArray(value)) {
                        hasNestedData = true;
                        this.updateHeaders(fullPath);
                        value.forEach(subItem => 
                            this.processData(subItem, {
                                path: fullPath,
                                values: [...localContext.values]
                            })
                        );
                    } else if (typeof value === 'object' && value !== null) {
                        hasNestedData = true;
                        this.processData(value, {
                            path: fullPath,
                            values: [...localContext.values]
                        });
                    } else {
                        localContext.values.push(String(value));
                        this.headers.add(fullPath.join('.'));
                    }
                }

                if (!hasNestedData && localContext.values.length > 0) {
                    this.rows.push(localContext.values);
                }
            } else {
                const rowValues = [...context.values, String(item)];
                if (rowValues.length > 0) {
                    this.rows.push(rowValues);
                }
            }
        } finally {
            this.currentDepth--;
        }
    }

    private processPrimitiveArray(items: any[], context: {path: string[], values: string[]}): void {
        items.forEach(item => {
            const rowValues = [...context.values, ...context.path, String(item)];
            this.rows.push(rowValues);
            context.path.forEach(p => this.headers.add(p));
            this.headers.add('value');
        });
    }

    private updateHeaders(path:  string[]): void {
        path.forEach((_, i) => {
            const partialPath = path.slice(0, i + 1).join('.');
            this.headers.add(partialPath);
        })
    }
}