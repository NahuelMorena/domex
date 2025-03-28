import { useContext, useCallback } from 'react';
import MapReduceContext from '@/context/MapReduceContext'
import usePeers from '@/hooks/usePeers'
import { socket } from '@/socket'

export const usePostulateNode = () => {
    const { dispatchMapReduce, mapReduceState} = useContext(MapReduceContext);
    const { broadcastMessage } = usePeers();

    const handlePostulate = useCallback(() => {
        console.log('Intentando postular nodo...')
        const timestamp = Date.now();
        const currentLeader = mapReduceState.leaderId;

        console.log('Lider actual:', currentLeader);

        if (!currentLeader || currentLeader.timestamp < timestamp) {
            console.log('Postulando nuevo lider...')
            const leaderInfo = {
                id: socket.userID,
                timestamp: timestamp
            };

            console.log("Enviando mensaje de postulación...")
            broadcastMessage({
                type: 'POSTULATE_NODE',
                payload: leaderInfo,
                userID: socket.userID
            });

            dispatchMapReduce({
                type: 'POSTULATE_NODE',
                payload: leaderInfo,
                userID: socket.userID
            });
        }
    }, [broadcastMessage, dispatchMapReduce, mapReduceState.leaderId]);

    const cancelPostulation = useCallback(() => {
        if (mapReduceState.isPostulated) {
            broadcastMessage({
                type: 'CANCEL_POSTULATION',
                userID: socket.userID
            });

            dispatchMapReduce({
                type: 'CANCEL_POSTULATION',
                userID: socket.userID
            });
        }
    }, [broadcastMessage, dispatchMapReduce, mapReduceState.isPostulated])

    return {
        postulateNode: handlePostulate,
        cancelPostulation,
        isPostulated: mapReduceState.isPostulated,
        leaderId: mapReduceState.leaderId?.id,
        canPostulate: !mapReduceState.leaderId || (mapReduceState.leaderId.id === socket.userID)
    };
};