import requests

URL = "http://localhost:8000/api/v1/debug/echo-image"
IMAGE_PATH = "v.jfif"

with open(IMAGE_PATH, "rb") as f:
    sent_bytes = f.read()

with open(IMAGE_PATH, "rb") as f:
    files = {"image": ("v.jfif", f)}
    res = requests.post(URL, files=files)

res.raise_for_status()

received_bytes = res.content

print("MATCH:", sent_bytes == received_bytes)
print("Sent size:", len(sent_bytes))
print("Received size:", len(received_bytes))