FROM python:3.11

WORKDIR /app

COPY sibive-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY sibive-backend/ .

EXPOSE 5000

CMD ["python", "app.py"]
