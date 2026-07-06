from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter

#here seprator is variable so chunk size is what matters
splitter = RecursiveCharacterTextSplitter(chunk_size = 200 , chunk_overlap = 10)

data = PyPDFLoader("C:/Users/laksh/Downloads/geu_book.pdf")
docs = data.load()

tokens = splitter.split_documents(docs)
print(len(tokens))