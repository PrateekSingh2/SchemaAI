import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, llmProvider, llmApiKey, dbType } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!llmApiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 401 });
    }

    let responseType = "text";
    let content = "";
    let toolCallData = null;

    if (llmProvider === "nvidia") {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${llmApiKey}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b",
          messages: [
            {
              role: "system",
              content: `You are an expert database assistant.
You can use tools to manipulate the UI or you can just respond conversationally in plain text.
If the user asks for a SQL query, call the generate_sql tool.
If the user asks to mask columns, call the apply_data_masking tool.
If the user asks to render a chart or visualization, call the render_visualization tool.
If none of those apply, reply naturally in plain text.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_sql",
                description: "Generates a SQL query for the user.",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "The SQL query string." }
                  },
                  required: ["query"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "render_visualization",
                description: "Changes the UI to show a chart.",
                parameters: {
                  type: "object",
                  properties: {
                    chart_type: { type: "string", enum: ["bar", "line", "pie"] },
                    data_key: { type: "string", description: "The column name to visualize." }
                  },
                  required: ["chart_type", "data_key"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "apply_data_masking",
                description: "Masks sensitive columns in the table.",
                parameters: {
                  type: "object",
                  properties: {
                    columns: { type: "array", items: { type: "string" } }
                  },
                  required: ["columns"]
                }
              }
            }
          ],
          tool_choice: "auto",
          temperature: 0.5,
          top_p: 1,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("NVIDIA API Error:", errorText);
        return NextResponse.json({ error: `NVIDIA API Error: ${response.statusText}` }, { status: response.status });
      }

      const data = await response.json();
      const message = data.choices[0]?.message;

      if (message?.tool_calls && message.tool_calls.length > 0) {
        const tc = message.tool_calls[0];
        responseType = "tool_call";
        content = "Tool Called";
        toolCallData = {
          tool: tc.function.name,
          args: JSON.parse(tc.function.arguments || "{}")
        };
      } else {
        const rawText = message?.content || "";
        const sqlMatch = rawText.match(/```sql\s*([\s\S]*?)```/i);
        
        if (sqlMatch && sqlMatch[1]) {
          responseType = "sql";
          content = sqlMatch[1].trim();
        } else {
          responseType = "text";
          content = rawText.trim();
        }
      }
    } else if (llmProvider === "gemini") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${llmApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `You are an expert database assistant.
You can use tools to manipulate the UI or you can just respond conversationally in plain text.
If the user asks for a SQL query, call the generate_sql tool.
If the user asks to mask columns, call the apply_data_masking tool.
If the user asks to render a chart or visualization, call the render_visualization tool.
If none of those apply, reply naturally in plain text.`
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          tools: [
            {
              functionDeclarations: [
                {
                  name: "generate_sql",
                  description: "Generates a SQL query for the user.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      query: { type: "STRING", description: "The SQL query string." }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "render_visualization",
                  description: "Changes the UI to show a chart.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      chart_type: { type: "STRING" },
                      data_key: { type: "STRING", description: "The column name to visualize." }
                    },
                    required: ["chart_type", "data_key"]
                  }
                },
                {
                  name: "apply_data_masking",
                  description: "Masks sensitive columns in the table.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      columns: { type: "ARRAY", items: { type: "STRING" } }
                    },
                    required: ["columns"]
                  }
                }
              ]
            }
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: "AUTO"
            }
          },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        return NextResponse.json({ error: `Gemini API Error: ${response.statusText}` }, { status: response.status });
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      if (part?.functionCall) {
        responseType = "tool_call";
        content = "Tool Called";
        toolCallData = {
          tool: part.functionCall.name,
          args: part.functionCall.args
        };
      } else {
        const rawText = part?.text || "";
        const sqlMatch = rawText.match(/```sql\s*([\s\S]*?)```/i);
        
        if (sqlMatch && sqlMatch[1]) {
          responseType = "sql";
          content = sqlMatch[1].trim();
        } else {
          responseType = "text";
          content = rawText.trim();
        }
      }
    } else {
      // Fallback or placeholder for other providers (OpenAI, Anthropic, etc.)
      return NextResponse.json({ error: `Provider ${llmProvider} not yet fully implemented in this demo. Please use NVIDIA NIM or Gemini.` }, { status: 400 });
    }

    return NextResponse.json({ type: responseType, content, toolCall: toolCallData });
  } catch (error) {
    console.error("Error generating SQL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
