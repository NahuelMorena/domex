import { type Server, type Socket } from 'socket.io'
import { type RoomSessionStore } from '../store/RoomSessionStore.js'
import { type ReturningSignalParams, type SendingSignalParams } from '../types.js'

export default function registerWebRTC(
  io: Server,
  socket: Socket,
  roomsSessionStore: RoomSessionStore,
): void {
  socket.on('room:postulate-node', (userID: string) => {
    console.log(`Nodo ${userID} se ha postulado en la sala ${socket.roomID}`);
    socket.to(socket.roomID).emit('room:postulate-node', userID);
  })

  socket.on('room:cancel-postulation', () => {
    console.log(`Postulación cancelada en la sala ${socket.roomID}`);
    socket.to(socket.roomID).emit('room:cancel-postulation');
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
