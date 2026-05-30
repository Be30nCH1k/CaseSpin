import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

// цепляю access токен к каждому запросу если он есть в localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// очередь запросов которые ждут пока обновится токен чтобы не спамить рефреш
let isRefreshing   = false
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: any) => void }> = []

// когда рефреш готов всем ожидающим отдаю новый токен либо ошибку
const flushQueue = (error: any, token: string | null = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error)
        else       resolve(token!)
    })
    pendingQueue = []
}

// перехватываю 401 ответ если токен протух пробую обновить через refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config

        // если это не 401 или уже пытался обновить токен выхожу
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error)
        }

        // если рефреш уже идёт ставлю запрос в очередь и жду
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject })
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`
                return api(original)
            })
        }

        original._retry = true
        isRefreshing = true

        const refresh = localStorage.getItem('refresh')

        // если refresh токена нет разлогиниваю и кидаю на страницу входа
        if (!refresh) {
            localStorage.clear()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        try {
            // дёргаю эндпоинт рефреша получаю новый access
            const { data } = await axios.post(`${BASE_URL}/token/refresh/`, { refresh })

            const newAccess = data.access
            localStorage.setItem('access', newAccess)

            // обновляю дефолтный заголовок и размораживаю очередь
            api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
            flushQueue(null, newAccess)

            // повторяю оригинальный запрос с новым токеном
            original.headers.Authorization = `Bearer ${newAccess}`
            return api(original)
        } catch (refreshError) {
            // если рефреш провалился чищу всё и на логин
            flushQueue(refreshError)
            localStorage.clear()
            window.location.href = '/login'
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

export default api