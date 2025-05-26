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
    print("")
    if user_input.lower() == "exit":
        break
    messages += "[User]: " + user_input + " [Assistant]: "

    print("[Abernathy]: ", end="")
    for output in llm(messages, stop=["[User]:"],max_tokens = 500, temperature = .1, stream = True):
        chat_output = output["choices"][0]["text"]
        print(chat_output, end="", flush = True)
        messages += chat_output
    messages += " "
    print("\n")