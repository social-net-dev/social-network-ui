// Runtime configuration
// Trong môi trường dev/local, file này có thể được dùng để override cấu hình
// Trong môi trường Docker production, file này sẽ được sinh tự động bởi entrypoint.sh
window.__ENV__ = {
  VITE_API_BASE_URL: undefined // Use default logic
};
