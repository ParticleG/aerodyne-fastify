export const subscribeSchema = {
  body: {
    type: 'object',
    required: ['subscription'],
    properties: {
      subscription: { type: 'object' },
    },
  },
};
