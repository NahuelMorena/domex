import { FileProcessor } from './FileProcessor'

export class CSVProcessor extends FileProcessor {
    async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const content = reader.result as string;
                    const delimiter = this.detectDelimiter(content);
                    if (!delimiter) {
                        throw new Error('No se pudo detectar el delimitador del archivo CSV');
                    }

                    const rows = content.split("\n").map(row => row.trim());

                    const data = rows.slice(1).map(row => {
                        return row.split(delimiter).map(value => value.trim());
                    });

                    const plainText = data.map(row => row.join(' ')).join('\n');
                    resolve(plainText);
                } catch (error: unknown) {
                    this.handleError(error, reject, 'Error al procesar CSV');
                }
            };
            reader.onerror = (error) => this.handleError(error, reject, 'Error al leer archivo CSV');
            reader.readAsText(file);
        });
    }

    /**
     *  Detecta el delimitador del archivo CSV basado en la frecuencia de los caracteres delimitadores comunes.
     *  @param content Contenido del archivo CSV.
     *  @returns El delimitador detectado o 'null' si no se detecta.
     */
    private detectDelimiter(content: string):string | null {
        const commonDelimiters = [',', ';', '|', '\t'];
        const lines = content.split("\n").filter(line => line.trim().length > 0);
        
        const sample = lines.length > 10 ? lines.slice(0, 10).join("\n") : lines.join("\n");
        const delimiterCounts = commonDelimiters.map(delimiter => ({
            delimiter,
            count: sample.split(delimiter).length
        }));
        const bestMatch = delimiterCounts.reduce((prev, current) => 
            current.count > prev.count ? current : prev
        );

        return bestMatch.count > 1 ? bestMatch.delimiter : null;
    }
}