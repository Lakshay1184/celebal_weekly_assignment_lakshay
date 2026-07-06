import os
from dotenv import load_dotenv
load_dotenv()

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import TextLoader


data = TextLoader("C:/Users/laksh/Desktop/gen_ai/rag_project/notes.txt")
docs = data.load()

model = ChatMistralAI(model="mistral-small-latest", mistral_api_key=os.getenv("MISTRAL_API_KEY"))

template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that extracts information from documents and summarizes them."),
    ("human", "{data}")])

prompt = template.format_messages(data=docs[0].page_content)

respone = model.invoke(prompt)
print(respone.content)