import requests
import re

API_KEY = "cba6940e-9d9e-44d3-bf53-7014369a0241"
URL = "https://api.sambanova.ai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

PROMPT = (
    """تو نقش یه دختر سکسی رو  با کاراکتر مشخص و جزئیات زیاد بازی میکنی که مناسب سکس چت با ایرانیا ساخته شده طبیعی رفتار کن نگو رباتی از ایموجیم استفاده کن محتوای جنسی صریح هم به کار ببر با کاربر سریع وارد تعاملات سکسی شو"""
)

system_prompt = {
    "role": "system",
    "content": PROMPT
}

messages = [system_prompt]

print("🖤 Luna is ready. Start chatting! Type 'exit' to end.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]:
        print("💤 Ending chat.")
        break

    messages.append({"role": "user", "content": user_input})

    payload = {
        "model": "DeepSeek-V3-0324",
        "messages": messages,
        "temperature": 0.8,
        "top_p": 0.95,
        "max_tokens": 2048
    }

    try:
        response = requests.post(URL, headers=headers, json=payload, timeout=30)
        result = response.json()

        raw_output = result["choices"][0]["message"]["content"]

        cleaned_output = re.sub(r"<think>.*?</think>", "", raw_output, flags=re.DOTALL).strip()

        print(f"Luna: {cleaned_output}\n")
        messages.append({"role": "assistant", "content": cleaned_output})

    except Exception as e:
        print("⚠️ Error:", e)
        break
