const JSON_SERVER_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001'

export class JsonServerClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = JSON_SERVER_URL
  }

  async get(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseUrl}/${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  // Méthodes utilitaires pour les relations
  async getWithRelations(endpoint: string, relations: string[] = []) {
    const expandParams = relations.map(rel => `_expand=${rel}`).join('&')
    const url = `${this.baseUrl}/${endpoint}${expandParams ? `?${expandParams}` : ''}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  async getWithEmbeds(endpoint: string, embeds: string[] = []) {
    const embedParams = embeds.map(embed => `_embed=${embed}`).join('&')
    const url = `${this.baseUrl}/${endpoint}${embedParams ? `?${embedParams}` : ''}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
}

export const jsonServer = new JsonServerClient()