let me give you more docs.

So heres front page # pip install -qU langchain "langchain[anthropic]"
from langchain.agents import create_agent

def get_weather(city: str) -> str:
"""Get weather for a given city."""
return f"It's always sunny in {city}!"

agent = create_agent(
model="claude-sonnet-4-5-20250929",
tools=[get_weather],
system_prompt="You are a helpful assistant",
)

# Run the agent

agent.invoke(
{"messages": [{"role": "user", "content": "what is the weather in sf"}]}
)

note we want to use gpt-4-turbo as our base.

now heres the tool syntax we have tof ollow
from langchain.agents import create_agent

@tool
def search(query: str) -> str:
"""Search for information."""
return f"Results for: {query}"

@tool
def get_weather(location: str) -> str:
"""Get weather information for a location."""
return f"Weather in {location}: Sunny, 72°F"

agent = create_agent(model, tools=[search, get_weather])

heres middleware with an error example (one catch all is fine for us)

Tool error handling
To customize how tool errors are handled, use the @wrap_tool_call decorator to create middleware:
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain.messages import ToolMessage

@wrap_tool_call
def handle_tool_errors(request, handler):
"""Handle tool execution errors with custom messages."""
try:
return handler(request)
except Exception as e: # Return a custom error message to the model
return ToolMessage(
content=f"Tool error: Please check your input and try again. ({str(e)})",
tool_call_id=request.tool_call["id"]
)

agent = create_agent(
model="gpt-4o",
tools=[search, get_weather],
middleware=[handle_tool_errors]
)
The agent will return a ToolMessage with the custom error message when a tool fails:
[
...
ToolMessage(
content="Tool error: Please check your input and try again. (division by zero)",
tool_call_id="..."
),
...
]
​
Tool use in the ReAct loop
Agents follow the ReAct (“Reasoning + Acting”) pattern, alternating between brief reasoning steps with targeted tool calls and feeding the resulting observations into subsequent decisions until they can deliver a final answer.
Example of ReAct loop

heres system prompt System prompt
You can shape how your agent approaches tasks by providing a prompt. The system_prompt parameter can be provided as a string:
agent = create_agent(
model,
tools,
system_prompt="You are a helpful assistant. Be concise and accurate."
)
When no system_prompt is provided, the agent will infer its task from the messages directly.
The system_prompt parameter accepts either a str or a SystemMessage. Using a SystemMessage gives you more control over the prompt structure, which is useful for provider-specific features like Anthropic’s prompt caching:
from langchain.agents import create_agent
from langchain.messages import SystemMessage, HumanMessage

literary_agent = create_agent(
model="anthropic:claude-sonnet-4-5",
system_prompt=SystemMessage(
content=[
{
"type": "text",
"text": "You are an AI assistant tasked with analyzing literary works.",
},
{
"type": "text",
"text": "<the entire contents of 'Pride and Prejudice'>",
"cache_control": {"type": "ephemeral"}
}
]
)
)

result = literary_agent.invoke(
{"messages": [HumanMessage("Analyze the major themes in 'Pride and Prejudice'.")]}
)
The cache_control field with {"type": "ephemeral"} tells Anthropic to cache that content block, reducing latency and costs for repeated requests that use the same system prompt.
​
Dynamic system prompt
For more advanced use cases where you need to modify the system prompt based on runtime context or agent state, you can use middleware.
The @dynamic_prompt decorator creates middleware that generates system prompts based on the model request:
from typing import TypedDict

from langchain.agents import create_agent
from langchain.agents.middleware import dynamic_prompt, ModelRequest

class Context(TypedDict):
user_role: str

@dynamic_prompt
def user_role_prompt(request: ModelRequest) -> str:
"""Generate system prompt based on user role."""
user_role = request.runtime.context.get("user_role", "user")
base_prompt = "You are a helpful assistant."

    if user_role == "expert":
        return f"{base_prompt} Provide detailed technical responses."
    elif user_role == "beginner":
        return f"{base_prompt} Explain concepts simply and avoid jargon."

    return base_prompt

agent = create_agent(
model="gpt-4o",
tools=[web_search],
middleware=[user_role_prompt],
context_schema=Context
)

# The system prompt will be set dynamically based on context

result = agent.invoke(
{"messages": [{"role": "user", "content": "Explain machine learning"}]},
context={"user_role": "expert"}
)
