export const tokenKey = "linkly_token"

export async function request(path, options = {}) {
  const token = localStorage.getItem(tokenKey)
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Something went wrong")
  return data
}
