import { TXTProcessor } from "./TXTProcessor";
import { JSONProcessor } from "./JSONProcessor";
import { CSVProcessor } from "./CSVProcessor";
import { XMLProcessor } from "./XMLProcessor";
import { ARFFProcessor } from "./ARFFProcessor";
import { FileProcessor } from "./FileProcessor";

export function getFileProcessor(file: File): FileProcessor {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
    switch (fileExtension) {
      case 'txt':
        return new TXTProcessor();
      case 'json':
        return new JSONProcessor();
      case 'csv':
        return new CSVProcessor();
      case 'xml':
        return new XMLProcessor();
      case 'arff':
        return new ARFFProcessor();
      default:
        throw new Error(`Formato de archivo no soportado: ${file.name}`);
    }
}