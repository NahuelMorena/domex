import { KeyValuesCount } from '@/types'
import { getFileProcessor } from './FileProcessorsModule/processors/getFileProcessor'
import { FileProcessorContext } from './FileProcessorsModule/FileProcessorContext'

/**
 * Sums up the values of a dictionary object.
 *
 * @param dict - The dictionary object containing key-value pairs.
 * @returns The sum of all the values in the dictionary.
 */
export const sumValues = (dict: KeyValuesCount) =>
  Object.values(dict).reduce((total, value) => total + value, 0)

/**
 * Calculates the average of an array of numbers.
 * @param values - An array of numbers to calculate the average of.
 * @returns The average of the numbers in the array.
 */
export const average = (values: number[]) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0

/**
 * Formats the given time value in nanoseconds into a human-readable format.
 * If the value is less than one second, it is displayed in milliseconds.
 * If the value is less than one minute, it is displayed in seconds.
 * Otherwise, it is displayed in minutes and seconds.
 *
 * @param valueNs - The time value in nanoseconds.
 * @returns The formatted time string.
 */
export function formatTime(valueNs: number) {
  // If is zero, return 0ms
  if (valueNs === 0) return '0ms'

  // Convert nanoseconds to seconds
  const valueS = valueNs / 1e9

  // If less than one second, display in milliseconds
  if (valueS < 1) return `${(valueS * 1e3).toFixed(2)}ms`

  // If less than one minute, display in seconds
  if (valueS < 60) return `${valueS.toFixed(2)}s`

  // Else display in minutes
  let minutes = Math.floor(valueS / 60)
  let remainingSeconds = (valueS % 60).toFixed(2)
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Concatenates the contents of multiple files into a single string.
 * @param files - An array of File objects representing the files to be concatenated.
 * @returns A Promise that resolves to the concatenated content of the files.
 * @throws If an error occurs while reading or concatenating the files.
 */
export async function concatenateFiles(files: File[]) {
  try {
    const readPromises = files.map(async (file) => {
      const processor = getFileProcessor(file);
      const context = new FileProcessorContext(processor);
      return await context.execute(file);
    });
  
    const contents = await Promise.all(readPromises);
    return contents.join('\n');
  } catch (error) {
    console.error('Error concatenando archivos:', error)
    throw error
  }
}

export const mergeStrings = (str1: string, str2: string) => {
  str1 = str1
  str2 = str2.trim()

  let mergePoint = 0
  let newString = ''

  for (let i = 0; i < str1.length; i++) {
    if (str2.startsWith(str1.substring(i))) {
      mergePoint = str1.length - i
      newString = str2.substring(str1.length - i) // Parte nueva de str2
      break
    }
  }

  let mergedString
  // Si hay una coincidencia, fusiona los strings en el punto de coincidencia.
  if (mergePoint > 0) {
    mergedString = str1 + newString // str2.substring(mergePoint) es igual a newPart
  } else {
    mergedString = str1 + (str1 ? '\n' : '') + str2
    newString = str2
  }

  return {
    mergedString: mergedString.trim(),
    newString: newString.trim(),
  }
}

/**
 * Checks if the provided code contains a valid function header.
 * @param code The code to check.
 * @param functionName The name of the function to validate.
 * @param argCount The expected number of arguments for the function.
 * @returns A boolean indicating whether the function header is valid or not.
 */
export const isValidFunctionHeader = (
  code: string,
  functionName: string,
  argCount: number,
): boolean => {
  let argsRegexPart = '\\s*\\w+\\s*'
  argsRegexPart = argsRegexPart + `,${argsRegexPart}`.repeat(argCount - 1)
  const regex = new RegExp(`^\\s*def\\s+${functionName}\\(\\s*${argsRegexPart}\\s*\\)\\s*:`)

  return regex.test(code)
}

export const validatePythonCode = `
try:
  with open('/code.py') as code:
    exec(code.read())
except Exception as e:
  message = str(e)
else:
  message = ''
finally:
  with open('/is_valid', 'w') as f:
    f.write(message)
`

export const resetPythonFiles = `
import os

for filename in os.listdir("/"):
  try:
    filepath = os.path.join("/", filename)
    if os.path.isfile(filepath):
        os.unlink(filepath)
  except Exception:
    pass
`
