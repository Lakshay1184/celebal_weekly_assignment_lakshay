import os
from dotenv import load_dotenv
load_dotenv()

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


embed = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
model = ChatMistralAI(model="mistral-small-latest", mistral_api_key=os.getenv("MISTRAL_API_KEY"))

vector_store = Chroma(persist_directory= "chroma-db" , embedding_function=embed)
retriver = vector_store.as_retriever(
    search_type = "mmr" , 
    search_kwargs = {"k" : 4 , "fetch_k" : 10 , "lambda_mult" : 0.5}
)

prompt = ChatPromptTemplate.from_messages(
    [( "system", """You are a helpful AI assistant.
        Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say: "I could not find the answer in the document."
"""),("human","""Context:{context}
      Question: {question}"""
        )
    ]
)
print("Rag system created ")
print("press 0 to exit ")

while True:
    query = input("You : ")
    if query == "0":
        break 
    
    docs = retriver.invoke(query)

    context = "\n\n".join(
        [doc.page_content for doc in docs]
    )
    
    final_prompt = prompt.invoke({
        "context" :context,
        "question": query
    })
    
    response = model.invoke(final_prompt)

    print(f"\n AI: {response.content}")