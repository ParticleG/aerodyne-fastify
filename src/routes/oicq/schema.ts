const loginSchema = {
  body: {
    type: "object",
    required: ["account"],
    properties: {
      account: { type: "number" },
      password: { type: "string" },
    },
  },
};

export { loginSchema };
