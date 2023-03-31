import { GraphiQLPlugin, Button } from "@graphiql/react"
import React, { useEffect, useRef, useState } from "react"

import { OpenAIProviderConfig, OpenAIService } from "../services/openai.service"

import "./ChatGPT.css"

export type ChatGPTPluginProps = {
  config: OpenAIProviderConfig
  query: string
  userId: string
  onEdit: (query: string) => void
}

const initialResult = `Click 'Suggest' button to see result..`
const primePrompt = "query {"

function ChatGPTPlugin({ config, userId, query, onEdit }: ChatGPTPluginProps) {
  const openAIService = new OpenAIService(config)

  const [result, setResult] = useState(initialResult)
  const [status, setStatus] = useState("")
  const [queryDesc, setQueryDesc] = useState("")
  const [isSuggestValid, setIsSuggestValid] = useState(false)
  const [isResultValid, setIsResultValid] = useState(false)

  if (!userId) {
    console.error("Missing user value: use with auth key..")
  }

  useEffect(() => {
    let status = ""

    if (!queryDesc) status = "Missing query description"
    if (!query) status = "Missing query"
    if (!userId) status = "Missing userId"

    setIsSuggestValid(!status)
    setStatus(status || "Ready..")
  }, [userId, query, queryDesc])

  useEffect(() => {
    setIsResultValid(!!result)
  }, [result])

  const getPrompt = () => {
    return [
      `### Generate graphql query based on following`,
      "#",
      ...query.split("\n").map((line, i) => (!i ? "##" : "") + `# ${line}`),
      "### " + queryDesc,
      primePrompt,
    ].join("\n")
  }

  const runQueryGeneration = async () => {
    setResult("")
    setStatus("Getting suggestion..")

    const result = await openAIService
      .createCompletion({
        model: "text-davinci-003",
        user: userId,
        prompt: getPrompt(),
        temperature: 0,
        max_tokens: 250,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: ["###"],
      })
      .then((response) => `${primePrompt}${response}`)
      .catch(console.error)

    setResult(result || "")
    setStatus("Ready!")
  }

  const selectSuggestion = () => {
    onEdit(result)
    setResult("")
  }

  console.log(getPrompt())

  return (
    <div className="graphiql-plugin-chatgpt">
      <h1>ChatGPT</h1>

      <h4>Describe a query to generate:</h4>
      <textarea value={queryDesc} onChange={(e) => setQueryDesc(e.target.value)} />

      <div style={{ marginTop: 10 }}>
        <Button type="button" onClick={runQueryGeneration} disabled={!isSuggestValid}>
          Suggest
        </Button>
        <em>{status}</em>
      </div>

      <br />

      <p>{result}</p>

      {result != initialResult && (
        <Button type="button" onClick={selectSuggestion} disabled={!isResultValid}>
          Set query
        </Button>
      )}
    </div>
  )
}

export function useChatGPTPlugin(props: ChatGPTPluginProps) {
  const propsRef = useRef(props)
  propsRef.current = props

  const pluginRef = useRef<GraphiQLPlugin>()
  pluginRef.current ||= {
    title: "ChatGPT",
    icon: () => (
      <svg strokeWidth="0.05" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    content: () => <ChatGPTPlugin {...propsRef.current} />,
  }
  return pluginRef.current
}
