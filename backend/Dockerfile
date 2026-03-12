#----------STAGE I ------------#

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

#----------STAGE II -----------#

FROM gcr.io/distroless/nodejs20-debian13 

WORKDIR /app

COPY --from=builder /app /app

ENV PORT=4000
EXPOSE 4000

CMD ["server.js"]

