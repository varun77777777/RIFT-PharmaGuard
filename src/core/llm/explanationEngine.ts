import { FinalReport } from "@/lib/types"

interface LLMResponse {
  explanation: string
}

export async function generateLLMExplanation(
  report: FinalReport
): Promise<string> {
  const response = await fetch("/api/llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: `Explain this pharmacogenomics report in simple terms:\n${JSON.stringify(
        report
      )}`
    })
  })

  if (!response.ok) {
    throw new Error("LLM explanation failed")
  }

  const data: LLMResponse = await response.json()

  return data.explanation
}
