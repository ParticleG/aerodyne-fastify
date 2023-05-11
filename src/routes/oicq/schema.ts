export const sliderGetSchema = {
  querystring: {
    type: 'object',
    required: ['account'],
    properties: {
      account: { type: 'number' },
      aid: { type: 'number' },
      apptype: { type: 'number' },
      cap_cd: { type: 'string' },
      clientype: { type: 'number' },
      sid: { type: 'number' },
      style: { enum: ['simple'] },
      uin: { type: 'number' },
    },
  },
};

export const sliderPostSchema = {
  body: {
    type: 'object',
    required: ['account', 'ticket'],
    properties: {
      account: { type: 'number' },
      ticket: { type: 'string' },
    },
  },
};

export interface sliderPostType {
  Body: {
    account: number;
    ticket: string;
  };
}
