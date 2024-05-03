'use client'

import { Code, UserID } from '@/types'
import { validatePythonCode, isValidFunctionHeader, mergeStrings } from '@/utils/helpers'
import { usePython } from 'react-py'
import useMapReduce from '@/hooks/useMapReduce'
import { Action, initialOutput } from '@/context/MapReduceContext'
import usePeers from '@/hooks/usePeers'
import useRoom from '@/hooks/useRoom'
import { useCallback, useEffect, useState } from 'react'
import useFiles from '@/hooks/useFiles'
import { CONFIG } from '@/constants/config'

export const usePythonCodeValidator = () => {
  const { runPython, stdout, stderr, isReady, readFile, writeFile, interruptExecution, isRunning } =
    usePython(CONFIG.REACTPY.USE_PYTHON_PROPS)

  const { dispatchMapReduce, mapReduceState } = useMapReduce()

  const { sendDirectMessage } = usePeers()

  const { roomOwner } = useRoom()

  const [stdoutHistory, setStdoutHistory] = useState({
    stdout: '',
    newStdout: '',
    prevNewStdout: '',
  })

  const { nodeHasFiles } = useFiles()

  const resetStdoutHistory = useCallback(
    () => setStdoutHistory({ stdout: '', newStdout: '', prevNewStdout: '' }),
    [],
  )

  const safeReadFile = async (path: string) => {
    try {
      return await readFile(path)
    } catch (e) {
      console.log('Error reading file', path, e)
      return '{}'
    }
  }

  useEffect(() => {
    if (!stdout) return

    setStdoutHistory((prevStdoutHistory) => {
      const { mergedString, newString } = mergeStrings(prevStdoutHistory.stdout, stdout)

      if (!newString || prevStdoutHistory.newStdout === newString) return prevStdoutHistory

      return {
        stdout: mergedString,
        newStdout: newString,
        prevNewStdout: prevStdoutHistory.prevNewStdout,
      }
    })
  }, [stdout])

  useEffect(() => {
    let newString = stdoutHistory.newStdout

    if (!newString || stdoutHistory.prevNewStdout === newString) return

    const mapExecuted = newString.match(/MAP EJECUTADO SATISFACTORIAMENTE/g) || []
    const combineExecuted = newString.match(/COMBINE EJECUTADO SATISFACTORIAMENTE/g) || []
    const reduceExecuted = newString.match(/REDUCE EJECUTADO SATISFACTORIAMENTE/g) || []

    if ((mapExecuted.length || combineExecuted.length) && !nodeHasFiles) {
      dispatchMapReduce({ type: 'MAP_EXECUTED' })
      return
    }

    if (reduceExecuted.length && !Object.keys(mapReduceState.reduceKeys).length) {
      return
    }

    const executed = [...mapExecuted, ...combineExecuted, ...reduceExecuted]

    if (executed.length)
      sendDirectMessage(roomOwner?.userID as UserID, {
        type: 'SET_STDOUT',
        payload: executed.join('\n'),
      })

    if (stdoutHistory.stdout)
      dispatchMapReduce({
        type: 'SET_STDOUT',
        payload: newString,
      })

    setStdoutHistory((prevStdoutHistory) => ({
      ...prevStdoutHistory,
      prevNewStdout: newString,
    }))
  }, [
    dispatchMapReduce,
    mapReduceState.reduceKeys,
    nodeHasFiles,
    roomOwner?.userID,
    sendDirectMessage,
    stdoutHistory,
    stdoutHistory.newStdout,
    stdoutHistory.stdout,
  ])

  const runPythonCodeValidator = async (code: string) => {
    await writeFile('/code.py', code)
    await runPython(validatePythonCode)
    const result = (await readFile('/is_valid')) || ('' as string)
    return result
  }

  const readErrors = async () => {
    let stderr
    try {
      stderr = JSON.parse((await readFile('/stderr.json')) || '')
    } catch (e) {
      stderr = initialOutput.stderr
    }
    dispatchStderr({ ...initialOutput.stderr, ...stderr })
    return hasErrors(stderr)
  }

  const dispatchStderr = (stderr: Code) => {
    const action: Action = {
      type: 'SET_STDERR',
      payload: stderr,
    }

    dispatchMapReduce(action)

    sendDirectMessage(roomOwner?.userID as UserID, action)
  }

  const hasErrors = (stderr: Code) => Object.values(stderr).some((error) => !!error)

  const isValidPythonCode = async (code: Code) => {
    const stderr = {
      mapCode: !isValidFunctionHeader(code.mapCode, 'fmap', 1)
        ? "La función debe llamarse 'fmap' y recibir un argumento (value)"
        : await runPythonCodeValidator(code.mapCode),
      combinerCode: !code.combinerCode
        ? ''
        : !isValidFunctionHeader(code.combinerCode, 'fcomb', 2)
          ? "La función debe llamarse 'fcomb' y recibir dos argumentos (key, values)"
          : await runPythonCodeValidator(code.combinerCode),
      reduceCode: !isValidFunctionHeader(code.reduceCode, 'fred', 2)
        ? "La función debe llamarse 'fred' y recibir dos argumentos (key, values)"
        : await runPythonCodeValidator(code.reduceCode),
    }

    dispatchStderr(stderr)

    return !hasErrors(stderr)
  }

  return {
    isValidPythonCode,
    readErrors,
    runPython,
    stdoutHistory,
    stderr,
    isReady,
    isRunning,
    readFile: safeReadFile,
    writeFile,
    resetStdoutHistory,
    interruptExecution,
  }
}
