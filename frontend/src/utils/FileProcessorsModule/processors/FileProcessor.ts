export abstract class FileProcessor {

    /**
     * Calcula el ancho necesario para cada columna en una tabla basada en el contenido de las filas. 
     * @param rows Arreglo bidimensional que representa las filas de la labla.
     * @returns Un arreglo con los anchos de cada columna.
     */
    protected calculateColumnWidth(rows: string[][]): number[] {
        return rows.reduce((widths, row) => {
            row.forEach((col, i) => {
                widths[i] = Math.max(widths[i] || 0, col.length);
            });
            return widths;
        }, [] as number[]);
    }

    /**
     * Formatea las filas de una tabla, ajustando el contendio de cada columna según los anchos proporcionados.
     * @param rows Arreglo bidimensional que representa las filas de la tabla.
     * @param columnWidths Ancho calculados para cada columna.
     * @returns Una cadena formateada que representa la tabla con columnas alineadas.
     */
    protected formatRows(rows: string[][], columnWidths: number[]): string {
        return rows.map(row => {
            return row.map((col, i) => col.padEnd(columnWidths[i])).join('\t');
        }).join('\n');
    }

    /**
     * Maneja errores en operaciones asincrónicas, rechazando la promesa con un mensaje personalizado.
     * @param error Error capturado durante la ejecución.
     * @param reject Función para rechazar la promesa.
     * @param customMessage Mensaje personalizado que se incluye en el error.
     */
    protected handleError(error: unknown, reject: (reason?: any) => void, customMessage: string): void {
        const errorMessage = error instanceof Error ? `${customMessage}: ${error.message}` : customMessage;
        reject(new Error(errorMessage));
    }
    
    /**
     * Método abstracto que debe ser implementado por las clases derivadas para procesar archivos.
     * @param file Archivo que será procesado.
     * @returns Una promesa que resuelve en una cadena representando el resultado del procesamiento.
     */
    abstract process(file: File): Promise<string>;
}