const loginSchema = {
    body: {
        type: 'object',
        required: ['account', 'password'],
        properties: {
            account: {type: 'string'},
            password: {type: 'string'},
        },
    }
};

export {loginSchema};