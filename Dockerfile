FROM python:3.13-slim

LABEL authors="vbaho"

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /app

EXPOSE 8000

CMD ["sh", "-c", "python3 manage.py migrate --noinput && python3 manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p 8000 config.asgi:application"]