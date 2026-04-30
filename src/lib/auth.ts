export type Role = 'super_admin' | 'admin'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: Role
}

export const getUser = (): User | null => {
  const s = localStorage.getItem('user')
  return s ? JSON.parse(s) : null
}

export const getToken = () => localStorage.getItem('token')

export const isAuthed = () => !!getToken()

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuth = () => localStorage.clear()
