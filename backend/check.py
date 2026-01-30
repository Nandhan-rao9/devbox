import google.generativeai as genai
import os

# Setup your API Key
genai.configure(api_key="AIzaSyCuWlCHCF4osABLvRMDFQ8B6OhsK49s5pg")

print("Available models supporting 'generateContent':")
print("-" * 45)

# List all models
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        # Most 'free' tier models are under the 'models/' prefix
        print(f"Model Name: {m.name}")
        print(f"Description: {m.description}")
        print(f"Input Limit: {m.input_token_limit} tokens\n")