import { type Server, type Socket } from 'socket.io'
import { type RoomSessionStore } from '../store/RoomSessionStore.js'
import { type ReturningSignalParams, type SendingSignalParams, type SetCodesParams } from '../types.js'

export default function registerWebRTC(
  io: Server,
  socket: Socket,
  roomsSessionStore: RoomSessionStore,
): void {
  socket.on('room:postulate-node', (userID: string) => {
    socket.to(socket.roomID).emit('room:postulate-node', userID);
  })

  socket.on('room:cancel-postulation', () => {
    socket.to(socket.roomID).emit('room:cancel-postulation');
  });

  socket.on('webrtc:set-codes', ({ userToSignal, code, callerID}: SetCodesParams) => {
    io.to(userToSignal).emit('webrtc:receive-codes', {
      code,
      callerID
    })
  })

  socket.on('send-user-ready-state', (state : boolean) => {
    socket.to(socket.roomID).emit('update-user-ready-state', state);
  })

  socket.on('node-disconnected', () => {
    socket.to(socket.roomID).emit('receive-node-disconnected');
  });

  socket.on('webrtc:sending-signal', ({ userToSignal, signal, callerID }: SendingSignalParams) => {
    io.to(userToSignal).emit('webrtc:user-joined', {
      signal,
      callerID,
    })
  })

  socket.on('webrtc:returning-signal', ({ callerID, signal }: ReturningSignalParams) => {
    io.to(callerID).emit('webrtc:receiving-returned-signal', {
      signal,
      userID: socket.userID,
    })
  })
}
