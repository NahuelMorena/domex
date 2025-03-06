'use client'

import RoomContext from '@/context/RoomContext'
import { socket } from '@/socket'
import { RoomID, UserID } from '@/types'
import { useRouter } from 'next/navigation'
import { useCallback, useContext, useEffect, useState } from 'react'
import usePeers from '@/hooks/usePeers'
import useMapReduce from '@/hooks/useMapReduce'

type ClusterAuthProps = {
  userName: string
  roomID?: RoomID
  creatingCluster: boolean
}

const useRoom = () => {
  const router = useRouter()
  const {
    clusterUsers,
    roomSession,
    roomOwner,
    isReadyToExecute,
    setIsReadyToExecute,
    setRoomSession,
  } = useContext(RoomContext)
  const { destroyPeers } = usePeers()

  const { dispatchMapReduce } = useMapReduce()

  const [postulatedNode, setPostulatedNode] = useState<UserID | null> (null);
  const [isPostulated, setIsPostulated] = useState(false);

  const postulateNode = useCallback((userID: UserID) => {
    console.log("Emitting room:postulate-node", userID);
    setPostulatedNode(userID);
    setIsPostulated(userID === socket.userID)
    socket.emit("room:postulate-node", userID);
  }, [])

  const cancelPostulation = useCallback((userID: UserID) => {
    console.log("Emitting room:cancel-postulation", userID);
    setPostulatedNode(null);
    setIsPostulated(false);
    socket.emit("room:cancel-postulation", userID);
  }, [])

  const joinCluster = useCallback((auth: ClusterAuthProps) => {
    socket.auth = auth
    socket.connect()
  }, [])

  const toggleRoomLock = useCallback((lock: boolean) => socket.emit('room:toggle-lock', lock), [])

  const kickUser = useCallback((userID: UserID) => socket.emit('room:kick-user', userID), [])

  const leaveRoom = useCallback(
    (kicked = false) => {
      socket.emit('room:leave-room', kicked)
      sessionStorage.clear()
      socket.disconnect()
      setRoomSession(null)
      destroyPeers()
      router.push('/')
      dispatchMapReduce({ type: 'RESET_READY_TO_EXECUTE' })
    },
    [destroyPeers, dispatchMapReduce, router, setRoomSession],
  )

  // TODO: If this will be used, we need to solve the issue of peers reconnections, or remove this and solve the inconsistency of states when the user refreshes the page while is executing a map-reduce job
  // useEffect(() => {
  //   return () => window.addEventListener('beforeunload', (_) => leaveRoom())
  // }, [leaveRoom])

  return {
    clusterUsers,
    roomSession,
    joinCluster,
    leaveRoom,
    kickUser,
    roomOwner,
    isReadyToExecute,
    setIsReadyToExecute,
    toggleRoomLock,
    setPostulatedNode,
    postulatedNode, 
    postulateNode,
    cancelPostulation,
    isPostulated,
    setIsPostulated
  }
}

export default useRoom
