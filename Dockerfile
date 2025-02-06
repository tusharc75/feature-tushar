FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app
COPY . .
RUN yarn install && yarn build

FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]