FROM node:22-alpine
LABEL "language"="nodejs"

WORKDIR /app

COPY . .

RUN npm install -g wrangler

EXPOSE 8080

CMD ["wrangler", "pages", "dev", ".", "--port", "8080"]
