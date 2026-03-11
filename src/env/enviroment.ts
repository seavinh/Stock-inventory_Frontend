export const enviroment = {
  production: false,
  apiBase: "https://stock-inventory-backend-7.onrender.com/api",
  apiEndpoints: {
    login: '/login',
    register: '/register',
    users: '/api/users',
    products: '/api/products',
    categories: '/api/categories',
    purchases: '/api/purchases',
    stockAdjustments: '/api/stockAdjustments'
  }
}