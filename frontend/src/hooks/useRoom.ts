'use client'

import RoomContext from '@/context/RoomContext'
import { socket } from '@/socket'
import { RoomID, UserID } from '@/types'
import { useRouter } from 'next/navigation'
import { useCallback, useContext, useState } from 'react'
import usePeers from '@/hooks/usePeers'
import useMapReduce from '@/hooks/useMapReduce'
import { actionTypes } from '@/context/MapReduceContext'

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
  const { destroyPeers, broadcastMessage } = usePeers()

  const { dispatchMapReduce } = useMapReduce()

  const [leaderInfo, setLeaderInfo] = useState<{id: UserID, timestamp: number} | null>(null)
  const isLeader = leaderInfo?.id === socket.userID

  const postulateNode = useCallback((newLeaderId: UserID | null) => {
    const timestamp = Date.now()
    const message = {
      type: actionTypes.POSTULATE_NODE,
      payload: newLeaderId ? {
        id: newLeaderId,
        timestamp
      } : null,
      isPostulated: newLeaderId === socket.userID,
      userID: socket.userID
    }
    broadcastMessage(message);
    dispatchMapReduce(message);
    setLeaderInfo(newLeaderId ? { id: newLeaderId, timestamp } : null)
  }, [broadcastMessage, dispatchMapReduce])

  const cancelPostulation = useCallback(() => {
    if (!leaderInfo) return

    const message = {
      type: actionTypes.CANCEL_POSTULATION,
      userID: socket.userID
    }

    broadcastMessage(message)
    dispatchMapReduce(message)
    setLeaderInfo(null)
  }, [broadcastMessage, dispatchMapReduce, leaderInfo])

  const joinCluster = useCallback((auth: ClusterAuthProps) => {
    socket.auth = auth
    socket.connect()
  }, [])

  const toggleRoomLock = useCallback((lock: boolean) => socket.emit('room:toggle-lock', lock), [])

  const kickUser = useCallback((userID: UserID) => socket.emit('room:kick-user', userID), [])

  const leaveRoom = useCallback(
    (kicked = false) => {
      if (isLeader) {
        cancelPostulation();
      }

      socket.emit('room:leave-room', kicked)
      sessionStorage.clear()
      socket.disconnect()
      setRoomSession(null)
      destroyPeers()
      router.push('/')
      dispatchMapReduce({ type: 'RESET_READY_TO_EXECUTE' })
    },
    [cancelPostulation, isLeader, destroyPeers, dispatchMapReduce, router, setRoomSession],
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
    postulateNode,
    cancelPostulation,
    isLeader,
    leaderId: leaderInfo?.id
  }
}

export default useRoom
