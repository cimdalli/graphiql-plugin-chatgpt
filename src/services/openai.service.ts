type OpenAIRequest = {
  model: string
  prompt: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
  user?: string
}

type OpenAIResult = {
  id: string
  object: string
  created: Date
  model: string
  choices: [{ text: string; index: number; finish_reason: string }]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

type OpenAIResponse = {
  data: OpenAIResult
  status: number
}

type BaseOpenAIProviderConfig = { apiKey: string; headers?: Record<string, string> }

type DefaultOpenAIProviderConfig = BaseOpenAIProviderConfig & {
  provider: "openai"
}

type AzureOpenAIProviderConfig = BaseOpenAIProviderConfig & {
  provider: "azure"
  endpoint: string
  apiVersion: string
}
export type OpenAIProviderConfig = DefaultOpenAIProviderConfig | AzureOpenAIProviderConfig

export class OpenAIService {
  private provider: OpenAIProvider
  constructor(config: OpenAIProviderConfig) {
    this.provider =
      config.provider === "azure"
        ? new AzureOpenAIProvider(config)
        : new DefaultOpenAIProvider(config)
  }

  public async createCompletion(req: OpenAIRequest) {
    const response = await this.provider.sendRequest("completions", req)
    const { data, status } = response

    if (status !== 200) {
      throw response
    }

    return data && data.choices[0].text
  }
}

abstract class OpenAIProvider<T extends BaseOpenAIProviderConfig = BaseOpenAIProviderConfig> {
  protected apiKey
  constructor(protected baseUrl: string, protected config: T) {
    this.apiKey = config.apiKey
  }

  protected abstract getAuthHeader(): Record<string, string>

  async sendRequest(path: string, req: OpenAIRequest): Promise<OpenAIResponse> {
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
        ...this.config.headers,
      },
      body: JSON.stringify(req),
    }

    const response = await fetch(`${this.baseUrl}/${path}`, request)

    return {
      data: (await response.json()) as OpenAIResult,
      status: response.status,
    }
  }
}

class DefaultOpenAIProvider extends OpenAIProvider {
  constructor(config: DefaultOpenAIProviderConfig) {
    super("https://api.openai.com", config)
  }

  protected getAuthHeader(): Record<string, string> {
    return { Authorization: "Bearer " + String(this.apiKey) }
  }

  async sendRequest(path: string, req: OpenAIRequest) {
    return super.sendRequest(`v1/${path}`, req)
  }
}

class AzureOpenAIProvider extends OpenAIProvider<AzureOpenAIProviderConfig> {
  constructor(config: AzureOpenAIProviderConfig) {
    super(config.endpoint, config)
  }

  protected getAuthHeader(): Record<string, string> {
    return { "api-key": this.apiKey }
  }

  async sendRequest(path: string, req: OpenAIRequest) {
    return super.sendRequest(`openai/deployment/${path}?api-version=${this.config.apiVersion}`, req)
  }
}
