export const ENVS = {
  SERVER: {
    URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  },
  GENERAL: {
    FILES: {
      MAX_SIZE: 5 * 1024 * 1024, // 5Mb
      ACCEPT: ['.txt', '.csv', '.json', '.xml', '.arff'],
      FILE_TYPES: [
        'text/plain',
        'text/csv',
        'application/json',
        'text/xml',
        'text/arff'
      ],
    },
    CHUNK_SIZE: 16 * 1024, // 16 KB
  },
}
