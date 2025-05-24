from llama_cpp import Llama

# Load LLM
model_path = "/Users/joelmendez/AreasOfLife/15Tech/AI/llama.cpp/models/Mistral-Nemo-Instruct-2407-Q4_0.gguf"
llm = Llama(
    model_path=model_path,
    n_ctx=4096,
    n_gpu_layers=35
)

messages = "[System]: You are a helpful Assistant. "
print("🔁 Abernathy is ready! Type 'exit' to quit.\n")

while True: 
    print("[User]: ", end = "")
    user_input = input()
    if user_input.lower() == "exit":
        break
    messages += "[User]: " + user_input + " [Assistant]: "

    output = llm(messages, stop=["[User]:"],max_tokens = 500, temperature = .9)
    chat_output = output["choices"][0]["text"]
    print("[Abernathy]: "+chat_output)
    messages += " "+chat_output