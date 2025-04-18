import { FileProcessor } from "./FileProcessor";

export class ARFFProcessor extends FileProcessor {
    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const content = reader.result as string;
                    const lines = content.split('\n');
                    const resultObject = this.processData(lines);
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

    private processData(lines: string[]): { attributes: string[], data: string[][] } {
        let attributes: string[] = [];
        let data: string[][] = [];
        let isDataSection = false;

        if (!lines.some(line => line.trim().startsWith('@relation'))) {
            throw new Error("El archivo ARFF debe comenzar con una declaración @relation");
        }

        lines.forEach(line => {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('%') || trimmedLine === '') {
                return;
            }

            if (trimmedLine.startsWith('@attribute')) {
                const attributeName = trimmedLine.split(' ')[1];
                if (!attributeName) {
                    throw new Error("Formato de atributo inválido: " + trimmedLine);
                }
                attributes.push(attributeName);
            }

            if (trimmedLine.startsWith('@data')) {
                isDataSection = true;
                return;
            }

            if (isDataSection && trimmedLine) {
                const row = trimmedLine.split(',').map(value => value.trim().replace(/^['"]|['"]$/g, ''));
                if (row.length !== attributes.length) {
                    throw new Error(`Número de columnas incorrecto. Esperado: ${attributes.length}, Obtenido: ${row.length}`);
                }
                data.push(row);
            }
        });

        if (attributes.length === 0) {
            throw new Error("No se encontraron atributos en el archivo ARFF");
        }

        if (!isDataSection) {
            throw new Error("No se encontró la sección @data en el archivo ARFF");
        }

        return {
            attributes: attributes,
            data: data
        };
    }
}