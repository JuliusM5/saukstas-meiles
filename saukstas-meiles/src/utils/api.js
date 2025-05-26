// Fake API for now - we'll use Firebase directly in components
const api = {
  get: () => Promise.reject(new Error('Use Firebase directly')),
  post: () => Promise.reject(new Error('Use Firebase directly')),
  put: () => Promise.reject(new Error('Use Firebase directly')),
  delete: () => Promise.reject(new Error('Use Firebase directly'))
};

export { api };