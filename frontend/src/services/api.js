const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Função para obter o token salvo no localStorage
export function getToken() {
  return localStorage.getItem("token");
}

// Salva dados de autenticação
export function setAuth(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

// Limpa dados ao deslogar
export function clearAuth() {
  const user = getCurrentUser();
  if (user?.id) {
    localStorage.removeItem(`reconecta_favoritos_${user.id}`);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("reconecta_favoritos");
}

// Pega o usuário logado atualmente
export function getCurrentUser() {
  const user = localStorage.getItem("usuario");
  return user ? JSON.parse(user) : null;
}

// Requisições autenticadas reutilizáveis
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || `Erro na requisição: ${response.status}`);
  }

  return data;
}
