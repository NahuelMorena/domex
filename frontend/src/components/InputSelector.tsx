'use client'

import { UserID } from '@/types'

import { ENVS } from '@/constants/envs'

import useFiles from '@/hooks/useFiles'

import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { IconButton, Tooltip, Zoom } from '@mui/material'
import Button from '@mui/material/Button'
import { useRef } from 'react'

const { ACCEPT: ACCEPT_TYPE, MAX_SIZE, FILE_TYPES } = ENVS.GENERAL.FILES

const MAX_SIZE_MB = MAX_SIZE / 1024 / 1024

type InputSelectorProps = {
  enableEditing: boolean
  id: UserID
  forwardRef?: React.RefObject<HTMLInputElement>
}

const SlaveInputSelector = ({ enableEditing }: InputSelectorProps) => {
  return (
    <Button
      className='w-[220px]'
      component='span'
      variant='outlined'
      startIcon={<CloudUploadIcon />}
      disabled={!enableEditing}>
      Cargar archivos
    </Button>
  )
}

const MasterInputSelector = ({ forwardRef }: InputSelectorProps) => {
  return (
    <IconButton
      aria-label='upload'
      size='medium'
      color='primary'
      onClick={() => forwardRef?.current?.click()}>
      <UploadFileIcon fontSize='inherit' />
    </IconButton>
  )
}

export default function InputSelector({
  id,
  enableEditing,
  isMaster,
}: {
  id: UserID
  enableEditing: boolean
  isMaster: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { addFilesFromMaster, addFilesFromSlave } = useFiles()

  const InputSelectorComponent = isMaster ? MasterInputSelector : SlaveInputSelector

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    // Check if there are files
    if (!selectedFiles) return

    const files = Array.from(selectedFiles) as File[];
    const filteredFiles = files.filter((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? '';
      return (
        FILE_TYPES.includes(file.type) ||
        (file.type === '' && ['arff'].includes(fileExtension))
      );
    }).filter((file) => file.size <= MAX_SIZE);

    if (isMaster) {
      addFilesFromMaster(filteredFiles, id)
    } else {
      addFilesFromSlave(filteredFiles)
    }
  }

  return (
    <>
      <input
        type='file'
        id={`fileInput-${id}`}
        ref={inputRef}
        accept={ACCEPT_TYPE.join(',')}
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={!enableEditing}
        onClick={(event) => {
          const inputElement = event.target as HTMLInputElement
          inputElement.value = ''
        }}
      />

      <Tooltip
        TransitionComponent={Zoom}
        title={`Deben ser ${ACCEPT_TYPE.join(" / ")} de máximo ${MAX_SIZE_MB}Mb cada uno`}>
        <label htmlFor={`fileInput-${id}`}>
          <InputSelectorComponent enableEditing={enableEditing} id={id} forwardRef={inputRef} />
        </label>
      </Tooltip>
    </>
  )
}
