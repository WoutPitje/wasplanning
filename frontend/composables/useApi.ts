export const useApi = () => {
  const config = useRuntimeConfig()
  
  const getApiUrl = (path: string = '') => {
    const baseUrl = config.public.apiUrl
    return path ? `${baseUrl}${path}` : baseUrl
  }
  
  return {
    getApiUrl
  }
}