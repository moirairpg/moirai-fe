FROM nginx:1.21.0-alpine as production

ENV NODE_ENV production

COPY ./dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

VOLUME /opt/chatrpg/cert

CMD ["nginx", "-g", "daemon off;"]