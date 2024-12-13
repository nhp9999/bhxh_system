import { setupCache } from 'axios-cache-adapter';

const cache = setupCache({
  maxAge: 15 * 60 * 1000, // Cache trong 15 phút
  exclude: {
    query: false,
    methods: ['post', 'patch', 'put', 'delete']
  }
});

export default cache; 